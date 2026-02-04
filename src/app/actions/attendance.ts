"use server";

import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

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
    take: 1000, // Safety limit
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

/**
 * Get attendance stats for a specific user (Profile View)
 */
export async function getUserAttendance(userId: string) {
  try {
    // 1. Get all Past Events (Attendance Clones that are inactive or events in past)
    // Actually, we should check against *All Events* that had attendance sessions?
    // Or just check `AttendanceEventClone`?
    // Let's assume an event counts if it has an AttendanceEventClone entry.

    const allEvents = await prisma.attendanceEventClone.findMany({
      where: {
        // Consider events that have started in the past
        startTime: { lt: new Date() },
      },
      include: {
        event: { select: { id: true, name: true, occasionDate: true } },
      },
      orderBy: { startTime: "desc" },
    });

    // 2. Get User's Attendance Records
    const userRecords = await prisma.attendanceRecord.findMany({
      where: { userId },
      select: { eventId: true, status: true, timestamp: true },
    });

    const attendedEventIds = new Set(userRecords.map((r) => r.eventId));

    // 3. Map to Calendar Data
    // Status: PRESENT (in records), ABSENT (in allEvents but not in records)
    const history = allEvents.map((clone) => {
      const isPresent = attendedEventIds.has(clone.eventId);
      return {
        eventId: clone.eventId,
        eventName: clone.event.name,
        date: clone.event.occasionDate, // Or clone.startTime? occasionDate is safer for calendar
        status: isPresent ? "PRESENT" : "ABSENT",
      };
    });

    return { success: true, data: history };
  } catch (error) {
    console.error("Error fetching user attendance:", error);
    return { success: false, error: "Failed to fetch attendance history" };
  }
}

/**
 * Get Overall Attendance Analytics (Admin View)
 */
export async function getAttendanceAnalytics() {
  try {
    // 1. Total Events Tracked
    const totalEvents = await prisma.attendanceEventClone.count();

    // 2. Total Attendance Records
    const totalRecords = await prisma.attendanceRecord.count();

    // 3. Average Attendance per Event
    const avgAttendance =
      totalEvents > 0 ? Math.round(totalRecords / totalEvents) : 0;

    // 4. Event-wise breakdown (Last 10)
    // We need to group by event. `groupBy` is good, but we need Event Names.
    // `findMany` on Clones with `_count` of records is better.

    const recentEvents = await prisma.attendanceEventClone.findMany({
      take: 10,
      orderBy: { startTime: "desc" },
      include: {
        event: { select: { name: true, occasionDate: true } },
      },
    });

    // Prisma `include` + `_count` sometimes tricky for nested.
    // Simpler: Fetch clones, then fetch counts? Or use `attendanceRecord.groupBy`

    const eventStats = await prisma.attendanceRecord.groupBy({
      by: ["eventId"],
      _count: { userId: true },
      orderBy: { _count: { userId: "desc" } }, // Top attended?
      take: 20,
    });

    // Hydrate names
    const eventIds = eventStats.map((e) => e.eventId);
    const events = await prisma.event.findMany({
      where: { id: { in: eventIds } },
      select: { id: true, name: true, occasionDate: true },
    });

    const eventMap = new Map(events.map((e) => [e.id, e]));

    const formattedStats = eventStats
      .map((stat) => ({
        id: stat.eventId,
        resource: eventMap.get(stat.eventId)?.name || "Unknown Event",
        date: eventMap.get(stat.eventId)?.occasionDate,
        count: stat._count.userId,
      }))
      .filter((s) => s.resource !== "Unknown Event");

    return {
      success: true,
      stats: {
        totalEvents,
        totalRecords,
        avgAttendance,
        chartData: formattedStats,
      },
    };
  } catch (error) {
    console.error("Error fetching analytics:", error);
    return { success: false, error: "Failed to fetch analytics" };
  }
}

/**
 * Get Event Details and Attendees for Drill Down
 */
export async function getEventAttendees(eventId: string) {
  try {
    const event = await prisma.event.findUnique({
      where: { id: eventId },
      select: { id: true, name: true, occasionDate: true, description: true },
    });

    if (!event) return { success: false, error: "Event not found" };

    const attendees = await prisma.attendanceRecord.findMany({
      where: { eventId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            its: true,
            floorMemberOf: { select: { name: true } },
            headedBy: { select: { name: true } },
          },
        },
      },
      orderBy: { user: { name: "asc" } },
    });

    const formattedAttendees = attendees.map((record) => ({
      id: record.user.id,
      name: record.user.name,
      its: record.user.its,
      floor: record.user.floorMemberOf[0]?.name || "Unassigned",
      head: record.user.headedBy?.name || "-",
      status: record.status,
      markedAt: record.timestamp,
    }));

    // ... existing code ...
    return { success: true, event, attendees: formattedAttendees };
  } catch (error) {
    console.error("Error fetching event attendees:", error);
    return { success: false, error: "Failed to fetch attendees" };
  }
}

export async function getAllAttendanceEvents() {
  try {
    const clones = await prisma.attendanceEventClone.findMany({
      include: {
        event: true,
      },
      orderBy: { startTime: "desc" },
    });

    const counts = await prisma.attendanceRecord.groupBy({
      by: ["eventId"],
      _count: { userId: true },
    });

    const countMap = new Map(counts.map((c) => [c.eventId, c._count.userId]));

    const data = clones.map((clone) => ({
      id: clone.event.id,
      name: clone.event.name,
      date: clone.event.occasionDate,
      startTime: clone.startTime,
      endTime: clone.endTime,
      isActive: clone.isActive,
      attendeeCount: countMap.get(clone.eventId) || 0,
    }));

    return { success: true, data };
  } catch (error) {
    console.error("Error fetching master attendance events:", error);
    return { success: false, error: "Failed to fetch events" };
  }
}

export async function deleteMasterEvent(eventId: string) {
  const session = await getServerSession(authOptions);
  if ((session?.user as any)?.role !== "ADMIN") {
    return { success: false, error: "Unauthorized" };
  }

  try {
    await prisma.$transaction(async (tx) => {
      await tx.attendanceRecord.deleteMany({
        where: { eventId },
      });

      await tx.attendanceEventClone.deleteMany({
        where: { eventId },
      });

      await tx.event.delete({
        where: { id: eventId },
      });
    });

    revalidatePath("/admin/attendance-details");
    return { success: true };
  } catch (error) {
    console.error("Error deleting master event:", error);
    return { success: false, error: "Failed to delete event" };
  }
}
