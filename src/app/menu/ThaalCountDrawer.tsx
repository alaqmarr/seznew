"use client";

import { useState, useEffect, useMemo } from "react";
import {
    Drawer,
    DrawerContent,
    DrawerHeader,
    DrawerTitle,
    DrawerDescription,
    DrawerTrigger,
    DrawerFooter,
    DrawerClose
} from "@/components/ui/drawer";
import { updateEventThaalsDone } from "@/app/actions/menu";
import { Edit3, Loader2, Check, Utensils, Clock, Calculator, ShieldAlert } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
    eventId: string;
    currentTotal: number | null;
    expectedThaals: number;
    occasionDate: string;
    occasionTime: string;
    halls: string[];
    hallCounts: Record<string, number>;
    hallPermissions: Record<string, boolean>;
    isAdmin: boolean;
    bypassTimer?: boolean;
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

export function ThaalCountDrawer({
    eventId,
    currentTotal,
    expectedThaals,
    occasionDate,
    occasionTime,
    halls,
    hallCounts,
    hallPermissions,
    isAdmin,
    bypassTimer = false
}: Props) {
    const [open, setOpen] = useState(false);

    // State for local edits
    const [localHallCounts, setLocalHallCounts] = useState<Record<string, string>>({});
    const [localTotalOverride, setLocalTotalOverride] = useState<string>("");

    const [isLoading, setIsLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [countdown, setCountdown] = useState<{ hours: number; minutes: number; seconds: number } | null>(null);
    const [isAvailable, setIsAvailable] = useState(false);

    // Initialize local state from props when drawer opens
    useEffect(() => {
        if (open) {
            // Convert numbers to strings for inputs
            const initialCounts: Record<string, string> = {};
            halls.forEach(hall => {
                initialCounts[hall] = (hallCounts[hall] || 0).toString();
            });
            setLocalHallCounts(initialCounts);

            setLocalTotalOverride(currentTotal?.toString() || "");
        }
        // We solely want to reset when the drawer OPENS.
        // We exclusion hallCounts/etc from dependencies to prevent
        // background refreshes (polling) from wiping user input while they type.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open]);

    // Calculate sum of hall counts
    const calculatedSum = useMemo(() => {
        return halls.reduce((sum, hall) => {
            const val = parseInt(localHallCounts[hall] || "0", 10);
            return sum + (isNaN(val) ? 0 : val);
        }, 0);
    }, [localHallCounts, halls]);

    // Check if thaal entry is available (15 min after event)
    useEffect(() => {
        const checkAvailability = () => {
            const now = new Date();
            const { hours, minutes } = parseTimeString(occasionTime);

            const eventDate = new Date(occasionDate);
            eventDate.setHours(hours, minutes, 0, 0);

            // Available time = 15 min after event
            const availableTime = new Date(eventDate.getTime() + 15 * 60 * 1000);

            const diff = availableTime.getTime() - now.getTime();

            if (diff <= 0) {
                setIsAvailable(true);
                setCountdown(null);
            } else {
                setIsAvailable(false);
                const totalSeconds = Math.floor(diff / 1000);
                const h = Math.floor(totalSeconds / 3600);
                const m = Math.floor((totalSeconds % 3600) / 60);
                const s = totalSeconds % 60;
                setCountdown({ hours: h, minutes: m, seconds: s });
            }
        };

        checkAvailability();
        const interval = setInterval(checkAvailability, 1000);
        return () => clearInterval(interval);
    }, [occasionTime, occasionDate]);

    const handleHallChange = (hall: string, val: string) => {
        setLocalHallCounts(prev => ({ ...prev, [hall]: val }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);

        // Prepare updates
        const updates: Record<string, number> = {};
        halls.forEach(hall => {
            // Only include if user has permission AND value changed? 
            // Or just include all that user HAS permission for
            if (hallPermissions[hall]) {
                const val = parseInt(localHallCounts[hall] || "0", 10);
                if (!isNaN(val)) {
                    updates[hall] = val;
                }
            }
        });

        // Prepare override
        let totalOverride: number | undefined = undefined;
        if (isAdmin) {
            const overrideVal = parseInt(localTotalOverride, 10);
            // If manual value differs from sum, send it as override
            if (!isNaN(overrideVal) && overrideVal !== calculatedSum) {
                totalOverride = overrideVal;
            }
        }

        console.log("[ThaalCount] Submitting thaal counts:", updates, "and total override:", totalOverride, "for event ID:", eventId);

        const result = await updateEventThaalsDone(eventId, {
            hallCounts: Object.keys(updates).length > 0 ? updates : undefined,
            totalOverride
        });

        if (result.success) {
            console.log("[ThaalCount] Success");
            setSuccess(true);
            setTimeout(() => {
                setOpen(false);
                setSuccess(false);
            }, 1500);
        } else {
            console.log("[ThaalCount] Error:", result.error);
            setError(result.error || "Failed to update");
        }
        setIsLoading(false);
    };

    const pad = (n: number) => n.toString().padStart(2, '0');

    // Show countdown if not available yet (unless Bypassed)
    if (!bypassTimer && !isAvailable && countdown) {
        return (
            <div className="flex flex-col items-center gap-3 p-4 bg-black/20 rounded-xl border border-gold/20">
                <div className="flex items-center gap-2 text-cream/80">
                    <Clock className="w-4 h-4 text-gold animate-pulse" />
                    <span className="text-xs uppercase tracking-wider font-medium">Thaal count entry available in</span>
                </div>
                <div className="flex items-center gap-1 font-mono text-lg font-bold text-gold">
                    <span className="bg-black/30 px-2 py-1 rounded">{pad(countdown.hours)}</span>
                    <span>:</span>
                    <span className="bg-black/30 px-2 py-1 rounded">{pad(countdown.minutes)}</span>
                    <span>:</span>
                    <span className="bg-black/30 px-2 py-1 rounded">{pad(countdown.seconds)}</span>
                </div>
            </div>
        );
    }

    return (
        <Drawer open={open} onOpenChange={setOpen}>
            <DrawerTrigger asChild>
                <button
                    className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-gold/10 to-gold/20 hover:from-gold/20 hover:to-gold/30 text-gold-dark border border-gold/30 rounded-full font-bold text-sm transition-all shadow-sm hover:shadow"
                >
                    <Edit3 className="w-4 h-4" />
                    {currentTotal !== null ? "Edit Count" : "Enter Count"}
                </button>
            </DrawerTrigger>
            <DrawerContent className="h-[85dvh] rounded-t-3xl outline-none">
                <div className="mx-auto w-full max-w-lg flex flex-col h-full bg-white/80 backdrop-blur-md">
                    <DrawerHeader className="text-center flex-shrink-0 pt-6 px-4">
                        <DrawerTitle className="text-2xl md:text-3xl font-serif font-bold text-primary-dark">
                            Update Thaals Served
                        </DrawerTitle>
                        <DrawerDescription className="text-sm md:text-base text-gray-500 font-medium">
                            Update counts for each hall. Total is calculated automatically.
                        </DrawerDescription>
                    </DrawerHeader>

                    <div className="flex-1 overflow-y-auto px-4 pb-6 scrollbar-hide">
                        <form id="thaal-form" onSubmit={handleSubmit} className="space-y-6">
                            {/* Summary Cards */}
                            <div className="grid grid-cols-2 gap-3">
                                <div className="p-4 bg-white/80 rounded-2xl border border-gray-100 shadow-sm text-center">
                                    <p className="text-[10px] text-gray-400 uppercase tracking-widest font-bold mb-1">Expected</p>
                                    <p className="text-2xl md:text-3xl font-serif font-bold text-gray-700">{expectedThaals}</p>
                                </div>
                                <div className="p-4 bg-gold/10 rounded-2xl border border-gold/20 shadow-sm text-center relative overflow-hidden">
                                    <div className="absolute top-0 right-0 p-2 opacity-10">
                                        <Utensils className="w-10 h-10 text-gold-dark" />
                                    </div>
                                    <p className="text-[10px] text-gold-dark uppercase tracking-widest font-bold mb-1">Total Served</p>
                                    <p className="text-2xl md:text-3xl font-serif font-bold text-gold-dark">
                                        {isAdmin ? (
                                            localTotalOverride || calculatedSum
                                        ) : (
                                            calculatedSum
                                        )}
                                    </p>
                                    {calculatedSum !== parseInt(localTotalOverride || "0") && isAdmin && localTotalOverride && (
                                        <span className="absolute top-2 right-2 text-[8px] bg-red-100 text-red-600 px-1.5 py-0.5 rounded-full flex items-center gap-0.5 uppercase font-bold tracking-wider">
                                            Manual
                                        </span>
                                    )}
                                </div>
                            </div>

                            {/* Hall Inputs */}
                            <div className="space-y-3">
                                <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider border-b border-gray-200 pb-2 flex items-center gap-2">
                                    <Utensils className="w-3 h-3" /> Hall Breakdown
                                </h4>

                                {halls.length === 0 ? (
                                    <p className="text-sm text-gray-400 italic text-center py-8 bg-gray-50/50 rounded-xl border border-dashed border-gray-200">
                                        No halls assigned to this event.
                                    </p>
                                ) : (
                                    <div className="grid gap-2">
                                        {halls.map((hall) => {
                                            const canEdit = hallPermissions[hall];
                                            return (
                                                <div key={hall} className={cn("flex items-center gap-3 p-3 rounded-xl border transition-all", canEdit ? "bg-white border-gray-200 shadow-sm" : "bg-gray-50 border-transparent opacity-80")}>
                                                    <div className="flex-grow">
                                                        <label className="text-sm md:text-base font-bold text-gray-800 block">
                                                            {hall}
                                                        </label>
                                                        {!canEdit && (
                                                            <span className="text-[9px] text-gray-400 italic font-medium uppercase tracking-wider">Read-only</span>
                                                        )}
                                                    </div>
                                                    <div className="w-24">
                                                        <input
                                                            type="number"
                                                            value={localHallCounts[hall] || ""}
                                                            onChange={(e) => handleHallChange(hall, e.target.value)}
                                                            disabled={!canEdit}
                                                            placeholder="0"
                                                            min="0"
                                                            className={cn("w-full px-3 py-2 text-right font-mono text-base md:text-lg font-bold border rounded-lg outline-none transition-all", canEdit ? "border-gray-200 focus:border-gold focus:ring-4 focus:ring-gold/10 bg-white" : "border-transparent bg-transparent text-gray-500")}
                                                        />
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>

                            {/* Admin Total Override */}
                            {isAdmin && (
                                <div className="pt-4 border-t border-dashed border-gray-200 space-y-3">
                                    <div className="flex items-center justify-between">
                                        <label className="text-[10px] font-bold text-red-400 uppercase tracking-wider flex items-center gap-2">
                                            <ShieldAlert className="w-3 h-3" /> Admin Override
                                        </label>
                                        <button
                                            type="button"
                                            onClick={() => setLocalTotalOverride(calculatedSum.toString())}
                                            className="text-[10px] font-bold uppercase tracking-wider text-blue-500 hover:text-blue-700 transition-colors"
                                        >
                                            Reset to Sum ({calculatedSum})
                                        </button>
                                    </div>
                                    <input
                                        type="number"
                                        value={localTotalOverride}
                                        onChange={(e) => setLocalTotalOverride(e.target.value)}
                                        placeholder="Enter total manually"
                                        className="w-full px-4 py-3 text-lg font-mono font-bold border border-red-200 bg-red-50/30 rounded-xl focus:ring-4 focus:ring-red-500/10 focus:border-red-500 outline-none transition-all text-red-700"
                                    />
                                    <p className="text-[10px] text-gray-400 font-medium">
                                        * Manually overriding the total will ignore hall counts.
                                    </p>
                                </div>
                            )}

                            {/* Error */}
                            {error && (
                                <div className="p-3 bg-red-50 border border-red-100 text-red-600 rounded-xl text-xs md:text-sm font-medium flex items-center gap-2 animate-in slide-in-from-bottom-2">
                                    <ShieldAlert className="w-4 h-4 flex-shrink-0" />
                                    {error}
                                </div>
                            )}
                        </form>
                    </div>

                    <div className="p-4 border-t border-gray-100 bg-white/50 backdrop-blur-md mt-auto pb-8">
                        <button
                            type="submit"
                            form="thaal-form"
                            disabled={isLoading}
                            className="w-full h-11 md:h-12 flex items-center justify-center gap-2 bg-primary-dark hover:bg-black text-white font-bold text-base md:text-lg rounded-xl transition-all shadow-lg shadow-primary-dark/20 disabled:opacity-70 disabled:shadow-none hover:scale-[1.01] active:scale-[0.99]"
                        >
                            {isLoading ? (
                                <Loader2 className="w-5 h-5 animate-spin" />
                            ) : success ? (
                                <>
                                    <Check className="w-5 h-5" />
                                    Updated
                                </>
                            ) : (
                                "Save Changes"
                            )}
                        </button>
                        <div className="mt-3 text-center">
                            <DrawerClose asChild>
                                <button
                                    type="button"
                                    className="text-gray-400 text-xs md:text-sm font-medium hover:text-gray-600 transition-colors"
                                >
                                    Cancel
                                </button>
                            </DrawerClose>
                        </div>
                    </div>
                </div>
            </DrawerContent>
        </Drawer>
    );
}
