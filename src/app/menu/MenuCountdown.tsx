"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Clock, Utensils } from "lucide-react";
import { OrnateCard } from "@/components/ui/premium-components";

interface MenuCountdownProps {
    occasionDate: string;
    occasionTime: string;
    eventTitle: string;
    children: React.ReactNode;
}

// Parse time string "7:30 PM" to hours and minutes
function parseTimeString(timeStr: string): { hours: number; minutes: number } | null {
    const match = timeStr.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
    if (!match) return null;

    let hours = parseInt(match[1]);
    const minutes = parseInt(match[2]);
    const isPM = match[3].toUpperCase() === 'PM';

    if (isPM && hours !== 12) hours += 12;
    if (!isPM && hours === 12) hours = 0;

    return { hours, minutes };
}

/**
 * Build the event's exact UTC timestamp from:
 *  - occasionDate: ISO string (e.g. "2025-02-20T00:00:00.000Z") — date portion only matters
 *  - occasionTime: "7:30 PM" style string — interpreted as IST (UTC+5:30)
 */
function buildEventDateIST(occasionDate: string, occasionTime: string): Date | null {
    const parsed = parseTimeString(occasionTime);
    if (!parsed) return null;

    // Extract the calendar date in IST by interpreting the ISO string date portion
    // occasionDate is typically stored as UTC midnight of the IST date, e.g.
    // "2025-02-20T00:00:00.000Z" means Feb 20 in IST (since IST = UTC+5:30, 
    // UTC midnight is already 5:30 AM IST of the same date).
    // We need the IST year/month/day, then combine with the time.

    // Get the date portion in IST
    const dateObj = new Date(occasionDate);
    
    // Format the date in IST to extract year, month, day
    const istFormatter = new Intl.DateTimeFormat('en-CA', {
        timeZone: 'Asia/Kolkata',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
    });
    const istDateStr = istFormatter.format(dateObj); // "YYYY-MM-DD"
    const [year, month, day] = istDateStr.split('-').map(Number);

    // Now build the event time as UTC by subtracting IST offset (5h30m)
    // IST = UTC + 5:30, so UTC = IST - 5:30
    const IST_OFFSET_MS = (5 * 60 + 30) * 60 * 1000;

    // Event time in IST as a UTC timestamp
    const eventUTC = Date.UTC(year, month - 1, day, parsed.hours, parsed.minutes, 0, 0) - IST_OFFSET_MS;

    return new Date(eventUTC);
}

export function MenuCountdown({ occasionDate, occasionTime, eventTitle, children }: MenuCountdownProps) {
    const [countdown, setCountdown] = useState<{ hours: number; minutes: number; seconds: number } | null>(null);
    const [showMenu, setShowMenu] = useState(false);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    useEffect(() => {
        const eventDate = buildEventDateIST(occasionDate, occasionTime);

        if (!eventDate) {
            // If we can't parse the time, just show the menu
            setShowMenu(true);
            return;
        }

        const checkVisibility = () => {
            const now = new Date();

            // Menu visible time = 30 min before event
            const menuVisibleTime = new Date(eventDate.getTime() - 30 * 60 * 1000);

            // Countdown Start Time = 24 hours before event
            const countdownStartTime = new Date(eventDate.getTime() - 24 * 60 * 60 * 1000);

            const timeToReveal = menuVisibleTime.getTime() - now.getTime();
            const timeToCountdownStart = countdownStartTime.getTime() - now.getTime();

            if (timeToReveal <= 0) {
                // Menu should be visible
                setShowMenu(true);
                setCountdown(null);
            } else if (timeToCountdownStart <= 0) {
                // Within 24h window — show countdown
                setShowMenu(false);
                const totalSeconds = Math.floor(timeToReveal / 1000);
                const h = Math.floor(totalSeconds / 3600);
                const m = Math.floor((totalSeconds % 3600) / 60);
                const s = totalSeconds % 60;
                setCountdown({ hours: h, minutes: m, seconds: s });
            } else {
                // More than 24h away — hide countdown
                setShowMenu(false);
                setCountdown(null);
            }
        };

        checkVisibility();
        const interval = setInterval(checkVisibility, 1000);
        return () => clearInterval(interval);
    }, [occasionTime, occasionDate]);

    // Poll for server updates every minute
    const router = useRouter();
    useEffect(() => {
        const interval = setInterval(() => {
            router.refresh();
        }, 60000);
        return () => clearInterval(interval);
    }, [router]);

    // Format Date for display in IST
    const formattedDate = new Intl.DateTimeFormat('en-US', {
        timeZone: 'Asia/Kolkata',
        weekday: 'long',
        day: 'numeric',
        month: 'long',
    }).format(new Date(occasionDate));

    if (!mounted) return null;

    if (showMenu) return <>{children}</>;

    return (
        <OrnateCard className="overflow-hidden border-gold/30 shadow-2xl relative">
            <div className="bg-primary-dark p-6 md:p-12 text-center relative z-10 min-h-[60vh] md:min-h-[500px] flex flex-col items-center justify-center">
                {/* Background Pattern */}
                <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/arabesque.png')] pointer-events-none" />

                {/* Dashed Border Decoration */}
                <div className="absolute inset-4 md:inset-6 border-2 border-dashed border-gold/20 rounded-xl pointer-events-none" />

                <div className="relative z-10 flex flex-col items-center gap-6 md:gap-8 w-full max-w-2xl">

                    {/* Icon */}
                    <div className="bg-gold/10 p-5 rounded-full ring-1 ring-gold/30 mb-2">
                        <Utensils className="w-12 h-12 text-gold" />
                    </div>

                    {/* Date & Title */}
                    <div className="space-y-4">
                        <h2 className="text-xl md:text-2xl text-gold/80 font-serif tracking-wide">
                            {formattedDate}
                        </h2>
                        <h1 className="text-4xl md:text-6xl font-bold text-cream font-serif drop-shadow-lg leading-tight">
                            {eventTitle}
                        </h1>
                    </div>

                    {/* Countdown Section or Available Soon Message */}
                    {countdown ? (
                        <div className="mt-8 flex flex-col items-center gap-6 w-full animate-in fade-in slide-in-from-bottom-5 duration-700">

                            {/* Stylish Badge */}
                            <div className="border border-dashed border-gold/40 px-8 py-2 rounded-full bg-gold/5 backdrop-blur-sm">
                                <span className="text-gold text-xs font-bold uppercase tracking-[0.2em]">
                                    Menu Available In
                                </span>
                            </div>

                            {/* Timer Grid */}
                            <div className="grid grid-cols-3 gap-4 md:gap-8 w-full max-w-md">
                                <TimeBox value={countdown.hours} label="Hours" />
                                <TimeBox value={countdown.minutes} label="Minutes" />
                                <TimeBox value={countdown.seconds} label="Seconds" />
                            </div>

                            <div className="mt-4 flex items-center gap-2 text-white/40 text-xs font-mono">
                                <Clock className="w-3 h-3" />
                                <span>Menu becomes available 30m before event</span>
                            </div>
                        </div>
                    ) : (
                        <div className="mt-8 flex flex-col items-center gap-4 animate-in fade-in zoom-in duration-500">
                            <div className="bg-white/5 border border-white/10 px-8 py-4 rounded-2xl backdrop-blur-sm">
                                <span className="text-xl md:text-2xl font-serif text-gold/80 italic">
                                    Menu update in progress.
                                </span>
                            </div>
                            <p className="text-cream/40 text-sm max-w-xs text-center">
                                The menu will be revealed 30 minutes before the event starts.
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </OrnateCard>
    );
}

function TimeBox({ value, label }: { value: number; label: string }) {
    return (
        <div className="flex flex-col items-center gap-2 group">
            <div className="relative bg-black/40 border border-gold/20 rounded-xl w-full aspect-square flex items-center justify-center shadow-lg group-hover:border-gold/40 transition-colors">
                <span className="text-4xl md:text-6xl font-bold text-gold font-mono tabular-nums">
                    {value.toString().padStart(2, '0')}
                </span>

                {/* Corner Accents */}
                <div className="absolute top-2 left-2 w-2 h-2 border-t border-l border-gold/30 rounded-tl-sm" />
                <div className="absolute bottom-2 right-2 w-2 h-2 border-b border-r border-gold/30 rounded-br-sm" />
            </div>
            <span className="text-[10px] md:text-xs font-bold text-gold/60 uppercase tracking-widest">{label}</span>
        </div>
    );
}
