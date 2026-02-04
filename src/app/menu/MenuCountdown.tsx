"use client";

import { useState, useEffect, useRef } from "react";
import { Clock, Utensils } from "lucide-react";
import { OrnateCard } from "@/components/ui/premium-components";

interface MenuCountdownProps {
    occasionDate: string;
    occasionTime: string;
    eventTitle: string;
    children: React.ReactNode;
}

// Parse time string "7:30 PM" to hours and minutes
function parseTimeString(timeStr: string): { hours: number; minutes: number } {
    const match = timeStr.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
    if (!match) return { hours: 19, minutes: 30 }; // Default 7:30 PM

    let hours = parseInt(match[1]);
    const minutes = parseInt(match[2]);
    const isPM = match[3].toUpperCase() === 'PM';

    if (isPM && hours !== 12) hours += 12;
    if (!isPM && hours === 12) hours = 0;

    return { hours, minutes };
}



export function MenuCountdown({ occasionDate, occasionTime, eventTitle, children }: MenuCountdownProps) {
    const [countdown, setCountdown] = useState<{ hours: number; minutes: number; seconds: number } | null>(null);
    const [showMenu, setShowMenu] = useState(false);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    useEffect(() => {
        const checkVisibility = () => {
            const now = new Date();
            const { hours, minutes } = parseTimeString(occasionTime);

            // Create event datetime from occasionDate and time
            const eventDate = new Date(occasionDate);
            eventDate.setHours(hours, minutes, 0, 0);

            // Countdown Start Time = 24 hours before event
            const countdownStartTime = new Date(eventDate.getTime() - 24 * 60 * 60 * 1000);

            // Menu visible time = 75 min before event
            const menuVisibleTime = new Date(eventDate.getTime() - 75 * 60 * 1000);

            const timeToReveal = menuVisibleTime.getTime() - now.getTime();
            const timeToCountdownStart = countdownStartTime.getTime() - now.getTime();

            if (timeToReveal <= 0) {
                // Menu should be visible
                setShowMenu(true);
                setCountdown(null);
            } else if (timeToCountdownStart <= 0) {
                // Within 24h window - Show countdown
                setShowMenu(false);
                const totalSeconds = Math.floor(timeToReveal / 1000);
                const h = Math.floor(totalSeconds / 3600);
                const m = Math.floor((totalSeconds % 3600) / 60);
                const s = totalSeconds % 60;
                setCountdown({ hours: h, minutes: m, seconds: s });
            } else {
                // More than 24h away - Hide countdown
                setShowMenu(false);
                setCountdown(null);
            }
        };

        checkVisibility();
        const interval = setInterval(checkVisibility, 1000);
        return () => clearInterval(interval);
    }, [occasionTime, occasionDate]);

    // Format Date for display (e.g., "Monday, 2nd February")
    const formattedDate = new Date(occasionDate).toLocaleDateString("en-US", {
        weekday: 'long',
        day: 'numeric',
        month: 'long'
    });

    if (!mounted) return null;

    if (showMenu) return <>{children}</>;

    return (
        <OrnateCard className="overflow-hidden border-gold/30 shadow-2xl relative">
            <div className="bg-primary-dark p-8 md:p-12 text-center relative z-10 min-h-[500px] flex flex-col items-center justify-center">
                {/* Background Pattern */}
                <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/arabesque.png')] pointer-events-none" />

                {/* Dashed Border Decoration */}
                <div className="absolute inset-6 border-2 border-dashed border-gold/20 rounded-xl pointer-events-none" />

                <div className="relative z-10 flex flex-col items-center gap-8 w-full max-w-2xl">

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
                                <span>Menu becomes available 75m before event</span>
                            </div>
                        </div>
                    ) : (
                        <div className="mt-8 flex flex-col items-center gap-4 animate-in fade-in zoom-in duration-500">
                            <div className="bg-white/5 border border-white/10 px-8 py-4 rounded-2xl backdrop-blur-sm">
                                <span className="text-xl md:text-2xl font-serif text-gold/80 italic">
                                    Menu Available Soon
                                </span>
                            </div>
                            <p className="text-cream/40 text-sm max-w-xs text-center">
                                The menu will be revealed 24 hours before the event starts.
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
