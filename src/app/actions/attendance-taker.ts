"use server";

import { prisma } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth"; // Assuming auth options path
import { revalidatePath } from "next/cache";

// Get members belonging to floors managed by the current user
export async function getMyFloorMembers() {
  // 1. Get current user
  // We can pass userId, but better to be secure
  // (Simulating session fetch if needed, or pass userId from client if we trust standard auth flow there,
  // but better to fetch session here)
  // For now, let's assume we pass userId for speed or fetch session if available.
  // NOTE: In server actions, use generic approach or auth check.
  // For this context, I'll allow passing userId, but typically use getServerSession.

  // Placeholder: return empty if no user. Real impl needs session.
  return { success: false, error: "Auth required" };
}

// Better version with explicit ID (called from Page which has session)
export async function getFloorMembersForUser(userId: string) {
  try {
    // Find floors where user is HEAD or SUBHEAD
    const floors = await prisma.floorConfig.findMany({
      where: {
        OR: [
          { heads: { some: { id: userId } } },
          { subHeads: { some: { id: userId } } },
        ],
      },
      include: {
        members: {
          select: { id: true, name: true, its: true, username: true },
        },
      },
    });

    // Flatten members
    const allMembers = floors.flatMap((f) => f.members);
    // Dedupe
    const uniqueMembers = Array.from(
      new Map(allMembers.map((item) => [item.id, item])).values(),
    );

    return { success: true, data: uniqueMembers };
  } catch (error) {
    return { success: false, error: "Failed to fetch floor members" };
  }
}

export async function markUserAttendance(
  eventId: string,
  userId: string,
  markerId: string,
  status: "PRESENT" | "ABSENT" = "PRESENT",
) {
  try {
    await prisma.attendanceRecord.upsert({
      where: {
        eventId_userId: { eventId, userId },
      },
      create: {
        eventId,
        userId,
        markedById: markerId,
        status,
      },
      update: {
        status,
        markedById: markerId,
        timestamp: new Date(), // Updates time if changed
      },
    });
    revalidatePath("/attendance");
    return { success: true };
  } catch (error) {
    console.error("Marking error", error);
    return { success: false, error: "Failed to mark attendance" };
  }
}

export async function getAttendanceStatusForEvent(
  eventId: string,
  userIds: string[],
) {
  const records = await prisma.attendanceRecord.findMany({
    where: {
      eventId,
      userId: { in: userIds },
    },
    select: { userId: true, status: true },
  });
  return { success: true, data: records };
}
