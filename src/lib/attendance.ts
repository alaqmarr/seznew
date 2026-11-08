import { prisma } from "@/lib/db";
import {
  fetchBridgeEventById,
  fetchBridgeEvents,
  parseEventTimeString,
} from "@/lib/jamatevents-api";
import { addHours, isWithinInterval } from "date-fns";

/**
 * Get the currently active event for attendance.
 * 1. Check for any 'AttendanceEventClone' that is explicitly active, hydrating event details from jamatevents.
 * 2. If none, check for any Public event happening NOW on jamatevents (Event Time <= Now <= Event Time + 6h).
 */
export async function getActiveAttendanceEvent() {
  const now = new Date();

  // 1. Check for Active Clone (Private or Public explicitly enforced)
  const activeClone = await prisma.attendanceEventClone.findFirst({
    where: {
      isActive: true,
      startTime: { lte: now },
      endTime: { gte: now },
    },
    include: {
      event: true,
    },
  });

  if (activeClone) {
    const liveEvent = await fetchBridgeEventById(activeClone.eventId).catch(
      () => null
    );
    return {
      type: "CLONE",
      event: liveEvent || activeClone.event,
      startTime: activeClone.startTime,
      endTime: activeClone.endTime,
    };
  }

  // 2. Check for Public Events from jamatevents within the 6-hour attendance window
  const startOfSearch = new Date(now);
  startOfSearch.setHours(startOfSearch.getHours() - 12);

  const potentialEvents = await fetchBridgeEvents({
    types: ["PUBLIC"],
    excludeCancelled: true,
    from: startOfSearch,
  }).catch((error) => {
    console.error("Failed to fetch active public events from jamatevents:", error);
    return [];
  });

  for (const event of potentialEvents) {
    const { hours, minutes } = parseEventTimeString(event.occasionTime);
    const eventStart = new Date(event.occasionDate);
    eventStart.setHours(hours, minutes, 0, 0);

    const eventEnd = addHours(eventStart, 6);

    if (isWithinInterval(now, { start: eventStart, end: eventEnd })) {
      return {
        type: "PUBLIC_DEFAULT",
        event,
        startTime: eventStart,
        endTime: eventEnd,
      };
    }
  }

  return null;
}
