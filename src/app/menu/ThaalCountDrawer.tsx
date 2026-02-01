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
    isAdmin
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

    // Initialize local state from props
    useEffect(() => {
        if (open) {
            // Convert numbers to strings for inputs
            const initialCounts: Record<string, string> = {};
            halls.forEach(hall => {
                initialCounts[hall] = (hallCounts[hall] || 0).toString();
            });
            setLocalHallCounts(initialCounts);

            // Only set total override if it differs from sum of halls (meaning it was manually set) ??
            // OR just set it to current total
            setLocalTotalOverride(currentTotal?.toString() || "");
        }
    }, [open, halls, hallCounts, currentTotal]);

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

        const result = await updateEventThaalsDone(eventId, {
            hallCounts: Object.keys(updates).length > 0 ? updates : undefined,
            totalOverride
        });

        if (result.success) {
            setSuccess(true);
            setTimeout(() => {
                setOpen(false);
                setSuccess(false);
            }, 1500);
        } else {
            setError(result.error || "Failed to update");
        }
        setIsLoading(false);
    };

    const pad = (n: number) => n.toString().padStart(2, '0');

    // Show countdown if not available yet (unless Admin)
    if (!isAdmin && !isAvailable && countdown) {
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
                    className="inline-flex items-center gap-2 px-4 py-2 bg-gold/20 hover:bg-gold/30 text-gold border border-gold/30 rounded-lg font-bold text-sm transition-colors"
                >
                    <Edit3 className="w-4 h-4" />
                    {currentTotal !== null ? "Edit Count" : "Enter Count"}
                </button>
            </DrawerTrigger>
            <DrawerContent className="bg-white max-h-[90vh]">
                <div className="mx-auto w-full max-w-lg flex flex-col h-full">
                    <DrawerHeader className="text-center flex-shrink-0">
                        <DrawerTitle className="text-primary-dark font-serif text-2xl">
                            Update Thaals Served
                        </DrawerTitle>
                        <DrawerDescription className="text-neutral-500">
                            Update counts for each hall. Total is calculated automatically.
                        </DrawerDescription>
                    </DrawerHeader>

                    <div className="flex-1 overflow-y-auto px-4 pb-4">
                        <form id="thaal-form" onSubmit={handleSubmit} className="space-y-6">
                            {/* Summary Cards */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="p-4 bg-neutral-50 rounded-lg text-center">
                                    <p className="text-xs text-neutral-500 uppercase tracking-wide mb-1">Expected</p>
                                    <p className="text-2xl font-bold text-neutral-700">{expectedThaals}</p>
                                </div>
                                <div className="p-4 bg-gold/10 rounded-lg text-center border border-gold/20 relative">
                                    <p className="text-xs text-gold uppercase tracking-wide mb-1">Total Served</p>
                                    <p className="text-2xl font-bold text-gold">
                                        {isAdmin ? (
                                            localTotalOverride || calculatedSum
                                        ) : (
                                            calculatedSum
                                        )}
                                    </p>
                                    {calculatedSum !== parseInt(localTotalOverride || "0") && isAdmin && localTotalOverride && (
                                        <span className="absolute top-2 right-2 text-[10px] bg-red-100 text-red-600 px-1 rounded flex items-center gap-0.5">
                                            <ShieldAlert className="w-3 h-3" /> Manual
                                        </span>
                                    )}
                                </div>
                            </div>

                            {/* Hall Inputs */}
                            <div className="space-y-4">
                                <h4 className="text-sm font-bold text-primary-dark border-b border-neutral-100 pb-2 flex items-center gap-2">
                                    <Utensils className="w-4 h-4" /> Hall Breakdown
                                </h4>

                                {halls.length === 0 ? (
                                    <p className="text-sm text-neutral-400 italic text-center py-4">
                                        No halls assigned to this event.
                                    </p>
                                ) : (
                                    <div className="grid gap-3">
                                        {halls.map((hall) => {
                                            const canEdit = hallPermissions[hall];
                                            return (
                                                <div key={hall} className="flex items-center gap-4 p-3 rounded-lg border border-neutral-100 bg-neutral-50/50">
                                                    <div className="flex-grow">
                                                        <label className="text-sm font-medium text-neutral-700 block">
                                                            {hall}
                                                        </label>
                                                        {!canEdit && (
                                                            <span className="text-[10px] text-neutral-400 italic">Read-only</span>
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
                                                            className={`w-full px-3 py-2 text-right font-mono text-sm border rounded focus:ring-1 outline-none transition-colors ${canEdit
                                                                    ? "border-neutral-300 focus:border-gold focus:ring-gold/50 bg-white"
                                                                    : "border-transparent bg-transparent text-neutral-500"
                                                                }`}
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
                                <div className="pt-4 border-t border-dashed border-neutral-200">
                                    <div className="flex items-center justify-between mb-2">
                                        <label className="text-sm font-bold text-primary-dark flex items-center gap-2">
                                            <Calculator className="w-4 h-4" /> Manual Total Override
                                        </label>
                                        <button
                                            type="button"
                                            onClick={() => setLocalTotalOverride(calculatedSum.toString())}
                                            className="text-[10px] text-blue-600 hover:underline"
                                        >
                                            Reset to Sum ({calculatedSum})
                                        </button>
                                    </div>
                                    <input
                                        type="number"
                                        value={localTotalOverride}
                                        onChange={(e) => setLocalTotalOverride(e.target.value)}
                                        placeholder="Enter total manually"
                                        className="w-full px-4 py-3 border border-red-200 bg-red-50/10 rounded-lg focus:ring-2 focus:ring-red-500/20 focus:border-red-500 outline-none"
                                    />
                                    <p className="text-[10px] text-neutral-400 mt-1">
                                        * Admin only. Overrides the sum of halls.
                                    </p>
                                </div>
                            )}

                            {/* Error */}
                            {error && (
                                <div className="p-3 bg-red-50 border border-red-200 text-red-600 rounded-lg text-sm">
                                    {error}
                                </div>
                            )}
                        </form>
                    </div>

                    <DrawerFooter className="px-4 pb-6 pt-2 flex-shrink-0">
                        <button
                            type="submit"
                            form="thaal-form"
                            disabled={isLoading}
                            className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-primary hover:bg-primary-dark text-white font-bold rounded-lg transition-colors disabled:opacity-50"
                        >
                            {isLoading ? (
                                <Loader2 className="w-5 h-5 animate-spin" />
                            ) : success ? (
                                <>
                                    <Check className="w-5 h-5" />
                                    Updated!
                                </>
                            ) : (
                                "Save Changes"
                            )}
                        </button>
                        <DrawerClose asChild>
                            <button
                                type="button"
                                className="w-full px-6 py-3 text-neutral-600 font-medium rounded-lg hover:bg-neutral-100 transition-colors"
                            >
                                Cancel
                            </button>
                        </DrawerClose>
                    </DrawerFooter>
                </div>
            </DrawerContent>
        </Drawer>
    );
}
