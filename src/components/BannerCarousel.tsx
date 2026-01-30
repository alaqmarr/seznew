"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface Banner {
    id: string;
    imageUrl: string;
    href?: string | null;
    countdownTarget?: Date | string | null;
    countdownLabel?: string | null;
    x?: number | null;
    y?: number | null;
    countdownSize?: string | null;
    countdownColor?: string | null;
}

function CountdownPill({ target, label, x, y, size = "normal", color = "gold" }: { target: Date | string, label?: string | null, x?: number | null, y?: number | null, size?: string | null, color?: string | null }) {
    const [timeLeft, setTimeLeft] = useState("");
    const [isClient, setIsClient] = useState(false);

    useEffect(() => {
        setIsClient(true);
        const calculate = () => {
            const diff = new Date(target).getTime() - new Date().getTime();
            if (diff <= 0) return "Started";

            const days = Math.floor(diff / (1000 * 60 * 60 * 24));
            const totalHours = Math.floor(diff / (1000 * 60 * 60)); // Total hours
            const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((diff % (1000 * 60)) / 1000);

            // "within 48 hours switch to the hour countdown"
            if (diff > 48 * 60 * 60 * 1000) {
                return `${days} Days`;
            }

            return `${totalHours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        };

        setTimeLeft(calculate());
        const timer = setInterval(() => setTimeLeft(calculate()), 1000);
        return () => clearInterval(timer);
    }, [target]);

    const getSizeClasses = (s?: string | null) => {
        switch (s) {
            case "small": return "text-sm px-3 py-1.5 min-w-[80px]";
            case "large": return "text-3xl px-8 py-4 min-w-[160px]";
            case "xl": return "text-5xl px-10 py-6 min-w-[200px]";
            default: return "text-xl px-5 py-2.5 min-w-[120px]"; // normal
        }
    };

    const getColorClasses = (c?: string | null) => {
        return c === 'wine'
            ? "bg-primary/95 text-gold border-gold/30"
            : "bg-gold/90 text-primary-dark border-white/20";
    };

    if (!isClient || !x || !y) return null;

    return (
        <div
            className="absolute transform -translate-x-1/2 -translate-y-1/2 z-20 pointer-events-none"
            style={{ left: `${x}%`, top: `${y}%` }}
        >
            <div className={`backdrop-blur-md font-bold rounded-full shadow-xl text-center animate-in zoom-in-50 duration-500 border flex flex-col items-center justify-center ${getSizeClasses(size)} ${getColorClasses(color)}`}>
                {label && <div className="text-[0.6em] uppercase font-bold tracking-widest opacity-80 mb-0.5">{label}</div>}
                <div className="leading-none tracking-tight font-mono">{timeLeft}</div>
            </div>
        </div>
    );
}

export function BannerCarousel({ banners }: { banners: Banner[] }) {
    const [currentIndex, setCurrentIndex] = useState(0);

    // Auto-advance
    useEffect(() => {
        if (banners.length <= 1) return;
        const interval = setInterval(() => {
            setCurrentIndex((prev) => (prev + 1) % banners.length);
        }, 5000); // 5 seconds
        return () => clearInterval(interval);
    }, [banners.length]);

    const next = () => setCurrentIndex((prev) => (prev + 1) % banners.length);
    const prev = () => setCurrentIndex((prev) => (prev - 1 + banners.length) % banners.length);

    if (banners.length === 0) return null;

    return (
        <section className="w-full max-w-6xl mx-auto relative group">
            <div className="rounded-xl overflow-hidden border border-gold/10 shadow-sm transition-all">
                <div className="relative w-full aspect-[4/1] overflow-hidden bg-neutral-100">
                    {banners.map((banner, index) => (
                        <div
                            key={banner.id}
                            className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${index === currentIndex ? "opacity-100 z-10" : "opacity-0 z-0"
                                }`}
                        >
                            {/* Countdown Layer */}
                            {banner.countdownTarget && (
                                <CountdownPill
                                    target={banner.countdownTarget}
                                    label={banner.countdownLabel}
                                    x={banner.x}
                                    y={banner.y}
                                    size={banner.countdownSize}
                                    color={banner.countdownColor}
                                />
                            )}

                            {banner.href ? (
                                <Link href={banner.href} className="block w-full h-full">
                                    <img
                                        src={banner.imageUrl}
                                        alt="Banner"
                                        className="w-full h-full object-cover"
                                    />
                                </Link>
                            ) : (
                                <img
                                    src={banner.imageUrl}
                                    alt="Banner"
                                    className="w-full h-full object-cover"
                                />
                            )}
                        </div>
                    ))}

                    {/* Controls (Only if > 1) */}
                    {banners.length > 1 && (
                        <>
                            <button
                                onClick={(e) => { e.stopPropagation(); prev(); }}
                                className="absolute left-4 top-1/2 -translate-y-1/2 z-30 bg-black/30 hover:bg-black/50 text-white p-2 rounded-full backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                                <ChevronLeft className="w-5 h-5" />
                            </button>
                            <button
                                onClick={(e) => { e.stopPropagation(); next(); }}
                                className="absolute right-4 top-1/2 -translate-y-1/2 z-30 bg-black/30 hover:bg-black/50 text-white p-2 rounded-full backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                                <ChevronRight className="w-5 h-5" />
                            </button>

                            {/* Indicators */}
                            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-30 flex gap-2">
                                {banners.map((_, idx) => (
                                    <button
                                        key={idx}
                                        onClick={() => setCurrentIndex(idx)}
                                        className={`w-2 h-2 rounded-full transition-all ${idx === currentIndex ? "bg-white w-6" : "bg-white/50"
                                            }`}
                                    />
                                ))}
                            </div>
                        </>
                    )}
                </div>
            </div>
        </section>
    );
}
