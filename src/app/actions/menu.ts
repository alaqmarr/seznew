"use server";

import { getHallModuleId } from "@/lib/utils";
import { prisma } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { revalidatePath } from "next/cache";

// Update event thaals (per hall or total override)
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
  const isAdmin = role === "ADMIN";

  // 1. Initial Access Check
  if (!isAdmin) {
    // Must have the base permission to even try
    const hasBaseAccess = await prisma.userModuleAccess.findFirst({
      where: {
        userId,
        module: { id: "update-thaal-count-sezsecorg" },
      },
    });

    if (!hasBaseAccess) {
      return {
        success: false,
        error: "You do not have permission to update thaal counts.",
      };
    }
  }

  // Optimistic Concurrency Control (OCC) Loop
  const MAX_RETRIES = 5;
  let attempt = 0;

  while (attempt < MAX_RETRIES) {
    attempt++;

    // Fetch fresh event state
    const event = await prisma.event.findUnique({
      where: { id: eventId },
      select: { totalThaalsDone: true, hallCounts: true, updatedAt: true },
    });

    if (!event) {
      return { success: false, error: "Event not found" };
    }

    let finalTotal = event.totalThaalsDone || 0;
    // Clone existing db state to ensure we don't wipe concurrent updates to OTHER halls
    let finalHallCounts = (
      event.hallCounts ? JSON.parse(JSON.stringify(event.hallCounts)) : {}
    ) as Record<string, number>;

    // 2. Apply Hall Count Updates
    if (data.hallCounts) {
      for (const [hallName, count] of Object.entries(data.hallCounts)) {
        // Strict permission check for EACH hall
        if (!isAdmin) {
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

        finalHallCounts[hallName] = count;
      }

      // Recalculate total sum from valid hall counts
      finalTotal = Object.values(finalHallCounts).reduce(
        (a, b) => a + (b || 0),
        0,
      );
    }

    // 3. Handle Admin Override (Updates Total Directly)
    if (data.totalOverride !== undefined) {
      if (!isAdmin) {
        return {
          success: false,
          error: "Only Admin can manually override total",
        };
      }
      finalTotal = data.totalOverride;
    }

    try {
      // ATOMIC UPDATE: Only update if 'updatedAt' matches what we just read
      const result = await prisma.event.updateMany({
        where: {
          id: eventId,
          updatedAt: event.updatedAt, // Version check
        },
        data: {
          totalThaalsDone: finalTotal,
          hallCounts: finalHallCounts as any,
          updatedAt: new Date(), // Explicitly set new time to invalidate other reads
        },
      });

      if (result.count === 0) {
        // Update failed because someone else modified the record in between
        // Loop will retry, fetching the NEW state and re-applying our changes on top
        if (attempt === MAX_RETRIES) {
          return { success: false, error: "Server is busy, please try again." };
        }
        continue;
      }

      revalidatePath("/menu");
      return { success: true };
    } catch (error) {
      console.error("Failed to update thaals done:", error);
      return { success: false, error: "Failed to update" };
    }
  }

  return { success: false, error: "Update failed after multiple retries" };
}
