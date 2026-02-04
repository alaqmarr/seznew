"use server";

import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";

// Fetch today's/upcoming public events to clone
export async function getCloneableEvents() {
  // Fetch future events or today, sorted by nearest first
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const events = await prisma.event.findMany({
    where: {
      occasionDate: {
        gte: today,
      },
    },
    orderBy: { occasionDate: "asc" },
    take: 50,
  });
  return { success: true, data: events };
}

export async function createAttendanceSession(
  eventId: string,
  startTime: Date,
  endTime: Date,
) {
  try {
    // Deactivate others? Maybe not, allow multiple concurrent
    // Create or Update Clone
    const session = await prisma.attendanceEventClone.upsert({
      where: { eventId },
      create: {
        eventId,
        isActive: true,
        startTime,
        endTime,
      },
      update: {
        isActive: true,
        startTime,
        endTime,
      },
    });
    revalidatePath("/admin/attendance");
    revalidatePath("/attendance"); // Updates taker view
    return { success: true, data: session };
  } catch (error) {
    console.error("Error creating session:", error);
    return { success: false, error: "Failed to create session" };
  }
}

export async function stopAttendanceSession(eventId: string) {
  try {
    await prisma.attendanceEventClone.update({
      where: { eventId },
      data: { isActive: false },
    });
    revalidatePath("/admin/attendance");
    revalidatePath("/attendance");
    return { success: true };
  } catch (error) {
    return { success: false, error: "Failed to stop session" };
  }
}

export async function getActiveSessions() {
  const sessions = await prisma.attendanceEventClone.findMany({
    where: { isActive: true },
    include: { event: true },
  });
  return { success: true, data: sessions };
}

export async function getAttendanceStats(eventId: string) {
  // Breakdown by floor?
  // Total count, PRESENT count
  const totalRecords = await prisma.attendanceRecord.count({
    where: { eventId },
  });

  // Group by Floor (this is heavy, do simplified for now)
  const records = await prisma.attendanceRecord.findMany({
    where: { eventId },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          floorMemberOf: { select: { name: true } },
        },
      },
    },
  });

  return { success: true, data: records, count: totalRecords };
}
