"use server";

import { prisma } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export async function updateEventThaalsDone(
  eventId: string,
  totalThaalsDone: number,
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return { success: false, error: "Unauthorized" };
  }

  const role = (session.user as any).role;
  const userId = (session.user as any).id;

  // Check existing event to see if thaalsDone is already set
  const event = await prisma.event.findUnique({
    where: { id: eventId },
    select: { totalThaalsDone: true },
  });

  if (!event) {
    return { success: false, error: "Event not found" };
  }

  // If already set, only ADMIN can edit
  if (event.totalThaalsDone !== null && role !== "ADMIN") {
    return { success: false, error: "Only ADMIN can edit after initial entry" };
  }

  // For ADMIN_CUSTOM, check module access
  if (role === "ADMIN_CUSTOM") {
    const hasAccess = await prisma.userModuleAccess.findFirst({
      where: {
        userId,
        module: { id: "update-thaal-count-sezsecorg" },
      },
    });
    if (!hasAccess) {
      return { success: false, error: "No access to this module" };
    }
  } else if (role !== "ADMIN") {
    return { success: false, error: "Unauthorized role" };
  }

  try {
    await prisma.event.update({
      where: { id: eventId },
      data: { totalThaalsDone },
    });
    revalidatePath("/menu");
    return { success: true };
  } catch (error) {
    console.error("Failed to update thaals done:", error);
    return { success: false, error: "Failed to update" };
  }
}
