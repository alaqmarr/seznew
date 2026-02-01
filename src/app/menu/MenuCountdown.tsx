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

// Single digit with smooth slide-up animation
function SlideDigit({ digit }: { digit: string }) {
    const [current, setCurrent] = useState(digit);
    const [prev, setPrev] = useState(digit);
    const [animating, setAnimating] = useState(false);

    useEffect(() => {
        if (digit !== current) {
            setPrev(current);
            setCurrent(digit);
            setAnimating(true);
            const timer = setTimeout(() => setAnimating(false), 300);
            return () => clearTimeout(timer);
        }
    }, [digit, current]);

    return (
        <span className="relative inline-block w-[0.6em] h-[1.2em] overflow-hidden">
            {/* Previous digit sliding out */}
            <span
                className={`absolute inset-0 flex items-center justify-center transition-transform duration-300 ease-out ${animating ? '-translate-y-full' : 'translate-y-0'
                    }`}
                style={{ opacity: animating ? 0 : 1 }}
            >
                {animating ? prev : current}
            </span>
            {/* New digit sliding in */}
            {animating && (
                <span
                    className="absolute inset-0 flex items-center justify-center transition-transform duration-300 ease-out"
                    style={{ transform: animating ? 'translateY(0)' : 'translateY(100%)' }}
                >
                    {current}
                </span>
            )}
        </span>
    );
}

// Two-digit display with individual digit animations
function TwoDigitDisplay({ value }: { value: number }) {
    const padded = value.toString().padStart(2, '0');
    return (
        <>
            <SlideDigit digit={padded[0]} />
            <SlideDigit digit={padded[1]} />
        </>
    );
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

            // Menu visible time = 75 min before event
            const menuVisibleTime = new Date(eventDate.getTime() - 75 * 60 * 1000);

            const diff = menuVisibleTime.getTime() - now.getTime();

            if (diff <= 0) {
                // Menu should be visible
                setShowMenu(true);
                setCountdown(null);
            } else {
                // Show countdown
                setShowMenu(false);
                const totalSeconds = Math.floor(diff / 1000);
                const h = Math.floor(totalSeconds / 3600);
                const m = Math.floor((totalSeconds % 3600) / 60);
                const s = totalSeconds % 60;
                setCountdown({ hours: h, minutes: m, seconds: s });
            }
        };

        checkVisibility();
        const interval = setInterval(checkVisibility, 1000);
        return () => clearInterval(interval);
    }, [occasionTime, occasionDate]);

    if (!mounted) {
        return null; // Avoid hydration mismatch
    }

    if (showMenu) {
        return <>{children}</>;
    }

    // Show countdown
    return (
        <OrnateCard className="overflow-hidden border-gold/30 shadow-2xl">
            <div className="bg-primary-dark p-12 md:p-16 text-center relative overflow-hidden">
                <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/arabesque.png')] pointer-events-none" />

                <div className="relative z-10 flex flex-col items-center gap-8">
                    <div className="bg-gold/20 p-4 rounded-full ring-2 ring-gold/40">
                        <Utensils className="w-10 h-10 text-gold" />
                    </div>

                    <div className="space-y-2">
                        <span className="inline-block px-3 py-1 rounded-full border border-gold/30 bg-gold/10 text-gold text-xs font-bold uppercase tracking-widest">
                            Coming Soon
                        </span>
                        <h1 className="text-3xl md:text-5xl font-bold text-gold">
                            {eventTitle}
                        </h1>
                    </div>

                    <div className="space-y-4 mt-4">
                        <p className="text-cream/80 text-sm uppercase tracking-widest">
                            Menu available in
                        </p>

                        {countdown && (
                            <div className="flex items-center justify-center gap-3">
                                <div className="flex flex-col items-center">
                                    <span className="bg-black/40 text-gold text-4xl md:text-6xl font-bold px-4 py-3 rounded-lg border border-gold/20 font-mono">
                                        <TwoDigitDisplay value={countdown.hours} />
                                    </span>
                                    <span className="text-cream/60 text-xs mt-2 uppercase tracking-wider">Hours</span>
                                </div>
                                <span className="text-gold text-4xl font-bold">:</span>
                                <div className="flex flex-col items-center">
                                    <span className="bg-black/40 text-gold text-4xl md:text-6xl font-bold px-4 py-3 rounded-lg border border-gold/20 font-mono">
                                        <TwoDigitDisplay value={countdown.minutes} />
                                    </span>
                                    <span className="text-cream/60 text-xs mt-2 uppercase tracking-wider">Minutes</span>
                                </div>
                                <span className="text-gold text-4xl font-bold">:</span>
                                <div className="flex flex-col items-center">
                                    <span className="bg-black/40 text-gold text-4xl md:text-6xl font-bold px-4 py-3 rounded-lg border border-gold/20 font-mono">
                                        <TwoDigitDisplay value={countdown.seconds} />
                                    </span>
                                    <span className="text-cream/60 text-xs mt-2 uppercase tracking-wider">Seconds</span>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="flex items-center gap-2 text-cream/60 text-sm mt-4">
                        <Clock className="w-4 h-4" />
                        <span>Menu will be revealed 75 minutes before the event</span>
                    </div>
                </div>
            </div>
        </OrnateCard>
    );
}
