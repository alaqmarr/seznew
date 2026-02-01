import { prisma } from "@/lib/db";
import { MenuModal } from "./MenuModal";
import { formatInTimeZone, fromZonedTime } from "date-fns-tz";

export async function MenuAlert() {
    const timeZone = "Asia/Kolkata";

    // 1. Get the current date string in IST (e.g., "2026-02-01")
    const todayIstString = formatInTimeZone(new Date(), timeZone, "yyyy-MM-dd");

    // 2. Define the exact START and END of that day in IST, converted to UTC
    // Start: 2026-02-01 00:00:00.000 in IST
    const startOfDay = fromZonedTime(`${todayIstString} 00:00:00`, timeZone);
    // End: 2026-02-01 23:59:59.999 in IST
    const endOfDay = fromZonedTime(`${todayIstString} 23:59:59.999`, timeZone);

    try {
        const todaysEvent = await prisma.event.findFirst({
            where: {
                eventType: 'PUBLIC',
                status: { not: 'CANCELLED' },
                occasionDate: {
                    gte: startOfDay,
                    lt: endOfDay
                },
                menu: { not: null } // Only show if there IS a menu
            },
            select: {
                id: true,
                name: true,
                occasionDay: true,
                description: true,
                menu: true,
                occasionTime: true,
                occasionDate: true,
                thaalCount: true,
                hall: true,
                hallCounts: true
            }
        });

        if (!todaysEvent) return null;

        return (
            <MenuModal
                title={todaysEvent.description || todaysEvent.name}
                menu={todaysEvent.menu || "Menu details available on request."}
                time={todaysEvent.occasionTime}
                thaalCount={todaysEvent.thaalCount}
                halls={todaysEvent.hall || []}
                hallCounts={todaysEvent.hallCounts}
                occasionDate={todaysEvent.occasionDate.toISOString()}
            />
        );
    } catch (error) {
        console.error("Failed to fetch today's menu:", error);
        return null;
    }
}
