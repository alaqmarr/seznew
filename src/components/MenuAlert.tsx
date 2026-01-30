import { prisma } from "@/lib/db";
import { MenuModal } from "./MenuModal";

export async function MenuAlert() {
    // Get start and end of today in local time (serving logic)
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);

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
            />
        );
    } catch (error) {
        console.error("Failed to fetch today's menu:", error);
        return null;
    }
}
