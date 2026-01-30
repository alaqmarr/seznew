"use client"
import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { Utensils, X, ChefHat } from "lucide-react";
import { OrnateCard } from "./ui/premium-components";

interface MenuModalProps {
    title: string;
    menu: string;
    time: string;
    thaalCount: number;
    halls: string[];
    hallCounts: any;
}

export function MenuModal({ title, menu, time, thaalCount, halls, hallCounts }: MenuModalProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    // Parse hallCounts safely
    const hallData = hallCounts && typeof hallCounts === 'object' && !Array.isArray(hallCounts)
        ? Object.entries(hallCounts)
        : halls.map(h => [h, "-"]); // Fallback if no specific counts

    return (
        <>
            {/* Coupon Alert Bar */}
            <div
                onClick={() => setIsOpen(true)}
                className="w-full max-w-3xl mx-auto px-4 sm:px-0 cursor-pointer relative z-30"
            >
                <div className="bg-gradient-to-r from-primary-dark via-primary to-primary-dark text-white py-3 px-6 rounded-b-2xl shadow-md border-x border-b border-gold/30 flex items-center justify-between group hover:shadow-lg hover:shadow-gold/10 transition-all">
                    <div className="flex items-center gap-4">
                        <div className="bg-gold/20 p-1.5 rounded-full ring-1 ring-gold/40 group-hover:bg-gold/30 transition-colors animate-pulse">
                            <Utensils className="w-4 h-4 text-gold" />
                        </div>
                        <div>
                            <p className="text-[10px] uppercase tracking-widest text-gold font-bold mb-0 leading-none">Today's Menu</p>
                            <p className="font-bold text-lg leading-tight text-gold group-hover:text-gold-light transition-colors">
                                {title}
                            </p>
                        </div>
                    </div>

                    <div className="hidden sm:flex items-center gap-2 bg-black/20 px-3 py-1 rounded-full border border-white/10 group-hover:bg-black/30 transition-colors">
                        <span className="text-[10px] font-bold tracking-wide uppercase">View</span>
                        <ChefHat className="w-3 h-3 text-gold" />
                    </div>
                </div>
            </div>

            {/* Modal Overlay - Portaled */}
            {isOpen && mounted && createPortal(
                <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-primary-dark/80 backdrop-blur-sm animate-in fade-in duration-200">
                    {/* Backdrop click to close */}
                    <div className="absolute inset-0" onClick={() => setIsOpen(false)} />

                    <div className="relative z-10 w-full max-w-md animate-in zoom-in-95 duration-300">
                        <OrnateCard className="bg-white text-center p-0 overflow-hidden shadow-2xl border-gold/50 w-full max-h-[85dvh] flex flex-col">
                            {/* Header - Fixed at top */}
                            <div className="bg-primary-dark p-6 relative shrink-0">
                                <button
                                    onClick={() => setIsOpen(false)}
                                    className="absolute top-4 right-4 text-cream/50 hover:text-white transition-colors p-1 hover:bg-white/10 rounded-full"
                                >
                                    <X className="w-5 h-5" />
                                </button>

                                <div className="space-y-4">
                                    <span className="inline-block px-3 py-1 rounded-full bg-gold/20 text-gold text-[10px] font-bold uppercase tracking-widest border border-gold/20">
                                        Today's Feast
                                    </span>
                                    <h3 className="text-3xl font-bold text-gold leading-tight">
                                        {title}
                                    </h3>
                                </div>
                            </div>

                            {/* Scrollable Content */}
                            <div className="overflow-y-auto flex-1 min-h-0 overscroll-y-contain">
                                {/* Menu Content */}
                                <div className="p-8 space-y-6">
                                    <div className="space-y-2">
                                        <h4 className="font-[family-name:var(--font-lobster)] text-2xl text-primary-dark font-bold tracking-wide">The Menu</h4>
                                        <div className="w-16 h-1 bg-gold mx-auto rounded-full" />
                                    </div>

                                    <div className="prose prose-sm mx-auto text-neutral-600 font-medium leading-relaxed bg-neutral-50 p-4 rounded-lg border border-neutral-100">
                                        <div className="whitespace-pre-wrap">
                                            {menu}
                                        </div>
                                    </div>
                                </div>

                                {/* Hall Allocation */}
                                {/* Hall Allocation */}
                                <div className="bg-primary-dark text-cream border-t border-gold/20 relative overflow-hidden">
                                    <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/arabesque.png')] pointer-events-none" />
                                    <div className="relative z-10">
                                        <div className="grid grid-cols-2 bg-black/20 text-gold text-xs font-bold uppercase py-2 px-4 text-left tracking-wider">
                                            <span>Hall Name</span>
                                            <span className="text-right">Thaals</span>
                                        </div>
                                        <div className="divide-y divide-white/10 text-cream text-sm">
                                            {hallData.map(([name, count]: any, idx: number) => (
                                                <div key={idx} className="grid grid-cols-2 py-2 px-4 hover:bg-white/5 transition-colors">
                                                    <span className="font-medium text-left">{name}</span>
                                                    <span className="text-right font-bold text-gold">{count}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </OrnateCard>
                    </div>
                </div>,
                document.body
            )}
        </>
    );
}
