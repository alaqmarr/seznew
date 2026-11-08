"use server";

import { prisma } from "@/lib/db";
import {
  deleteBridgeEvent,
  fetchBridgeEventById,
  fetchBridgeEvents,
} from "@/lib/jamatevents-api";
import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

// Fetch today's/upcoming events from jamatevents to start attendance sessions
export async function getCloneableEvents() {
  const today = new Date();
  today.setDate(today.getDate() - 1);
  today.setHours(0, 0, 0, 0);

  try {
    const events = await fetchBridgeEvents({
      from: today,
      excludeCancelled: true,
      limit: 50,
      order: "asc",
    });
    return { success: true, data: events };
  } catch (error) {
    console.error("Failed to fetch cloneable events from jamatevents:", error);
    return { success: false, data: [] };
  }
}

export async function createAttendanceSession(
  eventId: string,
  startTime: Date,
  endTime: Date,
) {
  try {
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
    revalidatePath("/attendance");
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
  } catch {
    return { success: false, error: "Failed to stop session" };
  }
}

export async function getActiveSessions() {
  const sessions = await prisma.attendanceEventClone.findMany({
    where: { isActive: true },
    include: { event: true },
  });

  if (sessions.length === 0) {
    return { success: true, data: [] };
  }

  const bridgeEvents = await fetchBridgeEvents({
    ids: sessions.map((s) => s.eventId),
  }).catch(() => []);
  const eventMap = new Map(bridgeEvents.map((e) => [e.id, e]));

  const hydrated = sessions.map((s) => ({
    ...s,
    event: eventMap.get(s.eventId) || s.event,
  }));

  return { success: true, data: hydrated };
}

export async function getAttendanceStats(eventId: string) {
  const totalRecords = await prisma.attendanceRecord.count({
    where: { eventId },
  });

  const records = await prisma.attendanceRecord.findMany({
    where: { eventId },
    take: 1000,
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
    const allEvents = await prisma.attendanceEventClone.findMany({
      where: {
        startTime: { lt: new Date() },
      },
      include: {
        event: { select: { id: true, name: true, occasionDate: true } },
      },
      orderBy: { startTime: "desc" },
    });

    const bridgeEvents =
      allEvents.length > 0
        ? await fetchBridgeEvents({
            ids: allEvents.map((c) => c.eventId),
          }).catch(() => [])
        : [];
    const bridgeMap = new Map(bridgeEvents.map((e) => [e.id, e]));

    const userRecords = await prisma.attendanceRecord.findMany({
      where: { userId },
      select: { eventId: true, status: true, timestamp: true },
    });

    const attendedEventIds = new Set(userRecords.map((r) => r.eventId));

    const history = allEvents.map((clone) => {
      const live = bridgeMap.get(clone.eventId);
      const isPresent = attendedEventIds.has(clone.eventId);
      return {
        eventId: clone.eventId,
        eventName: live?.name || clone.event.name,
        date: live?.occasionDate || clone.event.occasionDate,
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
    const totalEvents = await prisma.attendanceEventClone.count();
    const totalRecords = await prisma.attendanceRecord.count();
    const avgAttendance =
      totalEvents > 0 ? Math.round(totalRecords / totalEvents) : 0;

    const eventStats = await prisma.attendanceRecord.groupBy({
      by: ["eventId"],
      _count: { userId: true },
      orderBy: { _count: { userId: "desc" } },
      take: 20,
    });

    const eventIds = eventStats.map((e) => e.eventId);
    const bridgeEvents =
      eventIds.length > 0
        ? await fetchBridgeEvents({ ids: eventIds }).catch(() => [])
        : [];
    const eventMap = new Map(bridgeEvents.map((e) => [e.id, e]));

    // Fallback for any historical IDs not in jamatevents
    const missingIds = eventIds.filter((id) => !eventMap.has(id));
    if (missingIds.length > 0) {
      const fallbackEvents = await prisma.event.findMany({
        where: { id: { in: missingIds } },
        select: { id: true, name: true, occasionDate: true },
      });
      fallbackEvents.forEach((fe) => {
        eventMap.set(fe.id, fe as any);
      });
    }

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
    const bridgeEvent = await fetchBridgeEventById(eventId).catch(() => null);
    const event = bridgeEvent
      ? {
          id: bridgeEvent.id,
          name: bridgeEvent.name,
          occasionDate: bridgeEvent.occasionDate,
          description: bridgeEvent.description,
        }
      : await prisma.event.findUnique({
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

    const [bridgeEvents, counts] = await Promise.all([
      clones.length > 0
        ? fetchBridgeEvents({ ids: clones.map((c) => c.eventId) }).catch(() => [])
        : Promise.resolve([]),
      prisma.attendanceRecord.groupBy({
        by: ["eventId"],
        _count: { userId: true },
      }),
    ]);

    const bridgeMap = new Map(bridgeEvents.map((e) => [e.id, e]));
    const countMap = new Map(counts.map((c) => [c.eventId, c._count.userId]));

    const data = clones.map((clone) => {
      const live = bridgeMap.get(clone.eventId);
      return {
        id: live?.id || clone.event.id,
        name: live?.name || clone.event.name,
        date: live?.occasionDate || clone.event.occasionDate,
        startTime: clone.startTime,
        endTime: clone.endTime,
        isActive: clone.isActive,
        attendeeCount: countMap.get(clone.eventId) || 0,
      };
    });

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
    });

    await deleteBridgeEvent(eventId, {
      actorId: (session?.user as any)?.id,
      actorName: (session?.user as any)?.name || "Admin",
    }).catch((err) => {
      console.error("Bridge event delete warning:", err);
    });

    revalidatePath("/admin/attendance-details");
    return { success: true };
  } catch (error) {
    console.error("Error deleting master event:", error);
    return { success: false, error: "Failed to delete event" };
  }
}
