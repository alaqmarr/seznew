"use client";

import { useState } from "react";
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
import { Edit3, Loader2, Check, Utensils, X } from "lucide-react";

interface Props {
    eventId: string;
    currentValue: number | null;
    expectedThaals: number;
    canEdit: boolean; // ADMIN can always edit, ADMIN_CUSTOM only if not set
}

export function ThaalCountDrawer({ eventId, currentValue, expectedThaals, canEdit }: Props) {
    const [open, setOpen] = useState(false);
    const [value, setValue] = useState(currentValue?.toString() || "");
    const [isLoading, setIsLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);

        const num = parseInt(value, 10);
        if (isNaN(num) || num < 0) {
            setError("Please enter a valid number");
            setIsLoading(false);
            return;
        }

        const result = await updateEventThaalsDone(eventId, num);

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

    return (
        <Drawer open={open} onOpenChange={setOpen}>
            <DrawerTrigger asChild>
                <button
                    className="inline-flex items-center gap-2 px-4 py-2 bg-gold/20 hover:bg-gold/30 text-gold border border-gold/30 rounded-lg font-bold text-sm transition-colors"
                >
                    <Edit3 className="w-4 h-4" />
                    {currentValue !== null ? "Edit" : "Enter"} Thaals Done
                </button>
            </DrawerTrigger>
            <DrawerContent className="bg-white">
                <div className="mx-auto w-full max-w-md">
                    <DrawerHeader className="text-center">
                        <DrawerTitle className="text-primary-dark font-serif text-2xl">
                            Update Thaals Served
                        </DrawerTitle>
                        <DrawerDescription className="text-neutral-500">
                            Enter the actual number of thaals served for this event.
                        </DrawerDescription>
                    </DrawerHeader>

                    <form onSubmit={handleSubmit} className="px-4 pb-4 space-y-6">
                        {/* Expected vs Actual */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="p-4 bg-neutral-50 rounded-lg text-center">
                                <p className="text-xs text-neutral-500 uppercase tracking-wide mb-1">Expected</p>
                                <p className="text-2xl font-bold text-neutral-700">{expectedThaals}</p>
                            </div>
                            <div className="p-4 bg-gold/10 rounded-lg text-center border border-gold/20">
                                <p className="text-xs text-gold uppercase tracking-wide mb-1">Actual</p>
                                <p className="text-2xl font-bold text-gold">{currentValue ?? "—"}</p>
                            </div>
                        </div>

                        {/* Input */}
                        <div>
                            <label className="block text-sm font-medium text-neutral-700 mb-2">
                                <Utensils className="w-4 h-4 inline mr-2" />
                                Total Thaals Done
                            </label>
                            <input
                                type="number"
                                value={value}
                                onChange={(e) => setValue(e.target.value)}
                                placeholder="Enter number"
                                min={0}
                                disabled={!canEdit}
                                className="w-full px-4 py-3 text-lg border border-neutral-200 rounded-lg focus:ring-2 focus:ring-gold/50 focus:border-gold outline-none disabled:bg-neutral-100 disabled:cursor-not-allowed"
                            />
                            {!canEdit && (
                                <p className="mt-2 text-xs text-red-500">
                                    Only ADMIN can edit after initial entry
                                </p>
                            )}
                        </div>

                        {/* Error */}
                        {error && (
                            <div className="p-3 bg-red-50 border border-red-200 text-red-600 rounded-lg text-sm">
                                {error}
                            </div>
                        )}

                        {/* Actions */}
                        <DrawerFooter className="px-0">
                            <button
                                type="submit"
                                disabled={isLoading || !canEdit}
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
                                    "Save"
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
                    </form>
                </div>
            </DrawerContent>
        </Drawer>
    );
}
