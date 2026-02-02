import { prisma } from "@/lib/db";
import { MenuModal } from "./MenuModal";
import { getTodayRangeIST } from "@/lib/utils";

export async function MenuAlert() {
    const { start: startOfDay, end: endOfDay } = getTodayRangeIST();

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
