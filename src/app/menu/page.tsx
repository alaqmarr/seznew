import { prisma } from "@/lib/db";
import { OrnateCard, OrnateHeading } from "@/components/ui/premium-components";
import { Utensils, Calendar, Clock, MapPin } from "lucide-react";
import { format } from "date-fns";
import { GoldenButton } from "@/components/ui/premium-components"; // Assuming needed or general ui
import Link from "next/link";

export const dynamic = 'force-dynamic';

export default async function MenuPage() {
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
            hall: true,
            hallCounts: true
        }
    });

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

    return (
        <div className="min-h-screen py-20 px-4">
            <div className="max-w-3xl mx-auto space-y-8">
                <OrnateHeading
                    title="Community Menu"
                    subtitle="Upcoming Feast Details"
                    arabic="قائمة الطعام"
                />

                <OrnateCard className="overflow-hidden border-gold/30 shadow-2xl">
                    {/* Header */}
                    {/* 1. Header Section: Title & Stats */}
                    <div className="bg-primary-dark p-8 md:p-12 text-center relative overflow-hidden text-cream">
                        <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/arabesque.png')] pointer-events-none" />

                        <div className="relative z-10 flex flex-col items-center gap-4">
                            <span className="inline-block px-3 py-1 rounded-full border border-gold/30 bg-gold/10 text-gold text-xs font-bold uppercase tracking-widest">
                                {format(event.occasionDate, "EEEE, MMMM do")}
                            </span>

                            <h1 className="text-4xl md:text-6xl font-bold text-gold py-2">
                                {event.description || event.name}
                            </h1>

                            {/* Added Stats Section - Thaal Count & Halls */}
                            {/* Added Stats Section - Thaal Count & Halls */}
                            <div className="grid grid-cols-2 gap-6 mt-8 border-t border-white/10 pt-8 w-full max-w-lg mx-auto">
                                <div className="flex flex-col items-center gap-1">
                                    <Clock className="w-5 h-5 text-gold/80" />
                                    <span className="text-lg font-bold text-cream">{event.occasionTime}</span>
                                    <span className="text-[10px] uppercase opacity-60 tracking-wider">Time</span>
                                </div>
                                <div className="flex flex-col items-center gap-1">
                                    <Utensils className="w-5 h-5 text-gold/80" />
                                    <span className="text-lg font-bold text-cream">{event.thaalCount}</span>
                                    <span className="text-[10px] uppercase opacity-60 tracking-wider">Total Thaals</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* 2. Menu Section */}
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

                    {/* 3. Hall Allocation Section */}
                    {/* 3. Hall Allocation Section */}
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
            </div>
        </div>
    );
}
