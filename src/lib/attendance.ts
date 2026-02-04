import { prisma } from "@/lib/db";
import { addHours, isWithinInterval } from "date-fns";

/**
 * Get the currently active event for attendance.
 * Logic:
 * 1. Check for any 'AttendanceEventClone' that is explicitly active.
 * 2. If none, check for any Public event happening NOW (Event Time <= Now <= Event Time + 6h).
 */
export async function getActiveAttendanceEvent() {
  const now = new Date();

  // 1. Check for Active Clone (Private or Public explicitly enforced)
  // We assume there's only one active attendance session ideally, or we pick the first.
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
    return {
      type: "CLONE",
      event: activeClone.event,
      startTime: activeClone.startTime,
      endTime: activeClone.endTime,
    };
  }

  // 2. Check for Public Events (Default Logic)
  // Find events where (OccasionDate + OccasionTime) is within window
  // This is tricky with string times. We'll simplify:
  // Fetch events today, parse time, check window.

  // Fetch events where occasionDate is TODAY (UTC/IST considerations apply)
  // For simplicity, we fetch recent events and filter in JS
  const startOfSearch = new Date(now);
  startOfSearch.setHours(startOfSearch.getHours() - 12); // Look back 12 hours

  const potentialEvents = await prisma.event.findMany({
    where: {
      occasionDate: {
        gte: startOfSearch,
      },
      eventType: "PUBLIC",
    },
  });

  for (const event of potentialEvents) {
    // Construct full Date object for event start
    // event.occasionTime is likely "HH:mm" string
    const [hours, minutes] = event.occasionTime.split(":").map(Number);
    const eventStart = new Date(event.occasionDate);
    eventStart.setHours(hours, minutes, 0, 0);

    const eventEnd = addHours(eventStart, 6); // Ends 6 hours after start

    if (isWithinInterval(now, { start: eventStart, end: eventEnd })) {
      return {
        type: "PUBLIC_DEFAULT",
        event: event,
        startTime: eventStart,
        endTime: eventEnd,
      };
    }
  }

  return null;
}
