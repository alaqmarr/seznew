import { prisma } from "@/lib/db";
import { getHallModuleId } from "@/lib/utils";
import { OrnateCard, OrnateHeading } from "@/components/ui/premium-components";
import { Utensils, Clock, CheckCircle } from "lucide-react";
import Link from "next/link";
import { formatInTimeZone } from "date-fns-tz";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { ThaalCountDrawer } from "./ThaalCountDrawer";
import { MenuCountdown } from "./MenuCountdown";

export const dynamic = 'force-dynamic';

export default async function MenuPage() {
    const session = await getServerSession(authOptions);
    const role = (session?.user as any)?.role;
    const userId = (session?.user as any)?.id;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Find the nearest upcoming public event (today or future)
    const event = await prisma.event.findFirst({
        where: {
            eventType: 'PUBLIC',
            status: { not: 'CANCELLED' },
            occasionDate: { gte: today },
            menu: { not: null }
        },
        orderBy: {
            occasionDate: 'asc'
        },
        select: {
            id: true,
            name: true,
            description: true,
            occasionDay: true,
            menu: true,
            occasionDate: true,
            occasionTime: true,
            thaalCount: true,
            totalThaalsDone: true,
            hall: true,
            hallCounts: true
        }
    });

    // Check permissions
    let canShowDrawer = false;
    const hallPermissions: Record<string, boolean> = {};
    let userModules: any[] = [];

    if (session?.user) {
        if (role === "ADMIN") {
            canShowDrawer = true;
            if (event?.hall) {
                event.hall.forEach(h => hallPermissions[h] = true);
            }
        } else {
            // Fetch user modules
            userModules = await prisma.userModuleAccess.findMany({
                where: { userId },
                include: { module: true }
            });
            const userModuleIds = new Set(userModules.map(m => m.moduleId));

            // Check each hall
            if (event?.hall) {
                event.hall.forEach(h => {
                    const slug = getHallModuleId(h);
                    const hasAccess = userModuleIds.has(slug);
                    hallPermissions[h] = hasAccess;
                    if (hasAccess) canShowDrawer = true;
                });
            }

            // Also check global permission
            if (userModuleIds.has("update-thaal-count-sezsecorg")) {
                canShowDrawer = true;
            }
        }
    }

    if (!event) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-neutral-50">
                <OrnateCard className="max-w-md w-full text-center py-12 px-8">
                    <div className="bg-neutral-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
                        <Utensils className="w-10 h-10 text-neutral-400" />
                    </div>
                    <h2 className="text-2xl font-serif font-bold text-primary-dark mb-2">No Upcoming Menus</h2>
                    <p className="text-neutral-500 mb-8">There are no public events with menus scheduled at the moment.</p>
                    <Link href="/events">
                        <button className="text-primary hover:text-gold font-bold text-sm underline underline-offset-4">
                            Check Calendar
                        </button>
                    </Link>
                </OrnateCard>
            </div>
        );
    }

    const eventTitle = event.description || event.name;

    return (
        <div className="min-h-screen py-20 px-4">
            <div className="max-w-3xl mx-auto space-y-8">
                <OrnateHeading
                    title="Menu"
                    arabic="قائمة الطعام"
                />

                <MenuCountdown
                    occasionDate={event.occasionDate.toISOString()}
                    occasionTime={event.occasionTime}
                    eventTitle={eventTitle}
                >
                    <OrnateCard className="overflow-hidden border-gold/30 shadow-2xl">
                        {/* Header */}
                        <div className="bg-primary-dark p-8 md:p-12 text-center relative overflow-hidden text-cream">
                            <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/arabesque.png')] pointer-events-none" />

                            <div className="relative z-10 flex flex-col items-center gap-4">
                                <span className="inline-block px-3 py-1 rounded-full border border-gold/30 bg-gold/10 text-gold text-xs font-bold uppercase tracking-widest">
                                    {formatInTimeZone(event.occasionDate, "Asia/Kolkata", "EEEE, MMMM do")}
                                </span>

                                <h1 className="text-4xl md:text-6xl font-bold text-gold py-2">
                                    {eventTitle}
                                </h1>

                                {/* Stats Section - Always Centered */}
                                <div className="flex flex-wrap items-center justify-center gap-8 md:gap-12 mt-8 border-t border-white/10 pt-8">
                                    <div className="flex flex-col items-center gap-1">
                                        <Clock className="w-5 h-5 text-gold/80" />
                                        <span className="text-lg font-bold text-cream">{event.occasionTime}</span>
                                        <span className="text-[10px] uppercase opacity-60 tracking-wider">Time</span>
                                    </div>
                                    <div className="flex flex-col items-center gap-1">
                                        <Utensils className="w-5 h-5 text-gold/80" />
                                        <span className="text-lg font-bold text-cream">{event.thaalCount}</span>
                                        <span className="text-[10px] uppercase opacity-60 tracking-wider">Expected Thaals</span>
                                    </div>
                                </div>

                                {/* Prominent Thaals Done Display */}
                                {event.totalThaalsDone !== null && (
                                    <div className="mt-8 w-full max-w-sm mx-auto">
                                        <div className="bg-emerald-500/20 border-2 border-emerald-400/50 rounded-xl p-6 text-center backdrop-blur-sm">
                                            <div className="flex items-center justify-center gap-2 mb-2">
                                                <CheckCircle className="w-6 h-6 text-emerald-400" />
                                                <span className="text-sm font-bold text-emerald-400 uppercase tracking-wide">Thaals Served</span>
                                            </div>
                                            <span className="text-5xl font-bold text-emerald-400 block">
                                                {event.totalThaalsDone}
                                            </span>
                                        </div>
                                    </div>
                                )}

                                {/* Admin Drawer Button */}
                                {canShowDrawer && (
                                    <div className="mt-6">
                                        <ThaalCountDrawer
                                            eventId={event.id}
                                            currentTotal={event.totalThaalsDone}
                                            expectedThaals={event.thaalCount}
                                            occasionDate={event.occasionDate.toISOString()}
                                            occasionTime={event.occasionTime}
                                            halls={event.hall}
                                            hallCounts={(event.hallCounts as Record<string, number>) || {}}
                                            hallPermissions={hallPermissions}
                                            isAdmin={role === "ADMIN"}
                                        />
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Menu Section */}
                        <div className="p-8 md:p-12 bg-white text-center">
                            <div className="max-w-xl mx-auto space-y-8">
                                <div className="space-y-2">
                                    <h3 className="font-serif text-2xl text-primary-dark font-bold">The Menu</h3>
                                    <div className="w-24 h-1 bg-gold mx-auto rounded-full" />
                                </div>

                                <div className="prose prose-lg mx-auto text-neutral-600 leading-relaxed font-medium">
                                    <div className="whitespace-pre-wrap">
                                        {event.menu}
                                    </div>
                                </div>

                                <div className="pt-8 text-center">
                                    <p className="text-xs text-neutral-400 italic">
                                        * Menu items are subject to availability and change.
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Hall Allocation Section */}
                        <div className="bg-primary-dark relative overflow-hidden text-cream border-t border-gold/20">
                            <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/arabesque.png')] pointer-events-none" />

                            <div className="relative z-10 w-full">
                                <div className="grid grid-cols-2 bg-black/20 text-gold text-xs font-bold uppercase py-4 px-8 text-left tracking-wider">
                                    <span>Hall Name</span>
                                    <span className="text-right">Thaals Allocated</span>
                                </div>
                                <div className="divide-y divide-white/10 text-cream">
                                    {(event.hallCounts && typeof event.hallCounts === 'object' && !Array.isArray(event.hallCounts)
                                        ? Object.entries(event.hallCounts)
                                        : event.hall.map(h => [h, "-"])
                                    ).map(([name, count]: any, idx: number) => (
                                        <div key={idx} className="grid grid-cols-2 py-4 px-8 hover:bg-white/5 transition-colors">
                                            <span className="font-medium text-left">{name}</span>
                                            <span className="text-right font-bold text-gold">{count}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </OrnateCard>
                </MenuCountdown>
            </div>


            {/* User Access Info (Debug/Verification) */}
            {
                session?.user && (
                    <div className="max-w-3xl mx-auto mt-8 p-4 text-center">
                        <p className="text-[10px] text-neutral-400 uppercase tracking-widest mb-3">Your Access Permissions</p>
                        <div className="flex flex-wrap justify-center gap-2">
                            {role === "ADMIN" ? (
                                <span className="px-3 py-1 bg-primary text-white text-xs font-bold rounded-full shadow-sm">
                                    Administrator (Global Access)
                                </span>
                            ) : (
                                <div className="flex flex-col items-center gap-4">
                                    {/* List all assigned modules */}
                                    <div className="flex flex-wrap justify-center gap-2">
                                        {userModules && userModules.length > 0 ? (
                                            userModules.map((m) => (
                                                <span key={m.moduleId} className="px-2 py-1 bg-neutral-100 text-neutral-600 border border-neutral-200 text-xs font-medium rounded flex items-center gap-1">
                                                    {m.module.name}
                                                    {event?.hall && event.hall.some(h => getHallModuleId(h) === m.moduleId) && (
                                                        <CheckCircle className="w-3 h-3 text-emerald-500" />
                                                    )}
                                                </span>
                                            ))
                                        ) : (
                                            <span className="text-neutral-400 text-xs italic">No permissions assigned</span>
                                        )}
                                    </div>

                                    {/* Debug Data */}
                                    <div className="w-full max-w-lg mt-4 text-left bg-neutral-50 p-3 rounded border border-neutral-100">
                                        <p className="text-[10px] font-bold text-neutral-500 mb-1">Debug Diagnosis:</p>
                                        <div className="grid grid-cols-2 gap-2 text-[10px] font-mono text-neutral-600">
                                            <div>
                                                <span className="block font-bold">Event Halls Needed:</span>
                                                <ul className="list-disc pl-3">
                                                    {event?.hall?.map(h => (
                                                        <li key={h}>
                                                            "{h}" <br />
                                                            <span className="text-neutral-400">ID: {getHallModuleId(h)}</span>
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                            <div>
                                                <span className="block font-bold">Your Module IDs:</span>
                                                <ul className="list-disc pl-3">
                                                    {userModules?.map(m => (
                                                        <li key={m.moduleId} className={event?.hall?.some(h => getHallModuleId(h) === m.moduleId) ? "text-emerald-600 font-bold" : ""}>
                                                            {m.moduleId}
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )
            }
        </div >
    );
}
