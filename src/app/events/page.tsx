import { prisma } from "@/lib/db";
import { HijriCalendar } from "@/components/Calendar";
import { OrnateHeading, OrnateCard } from "@/components/ui/premium-components";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { EventType } from "@/generated/prisma/enums";

// Public Calendar Page
export const dynamic = 'force-dynamic';

export default async function EventsPage() {
    const session = await getServerSession(authOptions);
    const role = (session?.user as any)?.role;
    const userId = (session?.user as any)?.id;

    // Check if user can view private events
    let canViewPrivate = false;

    if (session?.user) {
        if (role === "ADMIN") {
            canViewPrivate = true;
        } else if (role === "ADMIN_CUSTOM" || role === "USER") {
            // Check module access for "view-private-events-sezsecorg"
            const hasAccess = await prisma.userModuleAccess.findFirst({
                where: {
                    userId,
                    module: { id: "view-private-events-sezsecorg" }
                }
            });
            canViewPrivate = !!hasAccess;
        }
    }

    // Build event type filter with proper typing
    const eventTypes: EventType[] = canViewPrivate
        ? [EventType.PUBLIC, EventType.PRIVATE]
        : [EventType.PUBLIC];

    const events = await prisma.event.findMany({
        where: {
            eventType: { in: eventTypes },
            status: {
                not: 'CANCELLED'
            }
        },
        select: {
            id: true,
            name: true,
            occasionDay: true,
            occasionDate: true,
            description: true,
            eventType: true,
        }
    });

    return (
        <div className="min-h-screen py-12 px-4 md:px-8 mt-12">
            <div className="max-w-7xl mx-auto space-y-8">
                <OrnateHeading
                    title="Community Calendar"
                    subtitle={canViewPrivate
                        ? "Public and private events with Hijri dates"
                        : "Upcoming public events and Hijri dates"}
                    arabic="التقويم الهجري"
                />

                <OrnateCard className="p-4 md:p-8 bg-white/80">
                    <HijriCalendar events={events} />
                </OrnateCard>
            </div>
        </div>
    );
}
