"use server";

import { getHallModuleId } from "@/lib/utils";
import { prisma } from "@/lib/db";
import { updateBridgeEventThaals } from "@/lib/jamatevents-api";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { revalidatePath } from "next/cache";

// Update event thaals (per hall or total override) via jamatevents API
export async function updateEventThaalsDone(
  eventId: string,
  data: {
    hallCounts?: Record<string, number>;
    totalOverride?: number;
  },
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return { success: false, error: "Unauthorized" };
  }

  const role = (session.user as any).role;
  const userId = (session.user as any).id;
  const userName =
    (session.user as any).name || (session.user as any).username || "Member";
  const isAdmin = role === "ADMIN";

  // 1. Validate per-hall permissions against members portal userModuleAccess
  if (data.hallCounts) {
    const hasGlobalUpdate = !isAdmin
      ? await prisma.userModuleAccess.findFirst({
          where: { userId, module: { id: "update-thaal-count-sezsecorg" } },
        })
      : null;

    for (const hallName of Object.keys(data.hallCounts)) {
      if (!isAdmin && !hasGlobalUpdate) {
        const moduleName = getHallModuleId(hallName);
        const hasHallAccess = await prisma.userModuleAccess.findFirst({
          where: { userId, module: { id: moduleName } },
        });

        if (!hasHallAccess) {
          return {
            success: false,
            error: `You do not have access to update ${hallName}`,
          };
        }
      }
    }
  }

  // 2. Validate Admin Override permission
  if (data.totalOverride !== undefined && !isAdmin) {
    return {
      success: false,
      error: "Only Admin can manually override total",
    };
  }

  // 3. Persist atomic update on jamatevents SQLite backend
  try {
    const bridgeResult = await updateBridgeEventThaals(eventId, {
      hallCounts: data.hallCounts,
      totalOverride: data.totalOverride,
      actorId: userId,
      actorName: userName,
    });

    if (!bridgeResult.ok) {
      return { success: false, error: bridgeResult.error };
    }

    revalidatePath("/menu");
    return { success: true };
  } catch (error) {
    console.error("Failed to update thaals done via jamatevents:", error);
    return { success: false, error: "Failed to update" };
  }
}
