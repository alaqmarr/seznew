"use client";

import { useState } from "react";
import { createBanner } from "@/app/actions/banner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ImageUpload } from "@/components/ui/ImageUpload";
import { GoldenButton, OrnateCard } from "@/components/ui/premium-components";
import { DateTimePicker } from "@/components/ui/date-time-picker";
import toast from "react-hot-toast";

export function BannerForm() {
    const [imageUrl, setImageUrl] = useState("");
    const [loading, setLoading] = useState(false);

    // Countdown State
    const [enableCountdown, setEnableCountdown] = useState(false);
    const [countdownTarget, setCountdownTarget] = useState<Date | undefined>(undefined);
    const [countdownLabel, setCountdownLabel] = useState("");
    const [countdownSize, setCountdownSize] = useState("normal");
    const [countdownColor, setCountdownColor] = useState("gold");
    const [pos, setPos] = useState({ x: 50, y: 50 });

    async function handleSubmit(formData: FormData) {
        if (!imageUrl) {
            toast.error("Please upload a banner image");
            return;
        }

        setLoading(true);
        formData.append('imageUrl', imageUrl);

        // Append Countdown Data
        if (enableCountdown && countdownTarget) {
            formData.append('countdownTarget', countdownTarget.toISOString());
            if (countdownLabel) formData.append('countdownLabel', countdownLabel);
            formData.append('x', pos.x.toString());
            formData.append('y', pos.y.toString());
            formData.append('countdownSize', countdownSize);
            formData.append('countdownColor', countdownColor);
        }

        try {
            await createBanner(formData);
            toast.success("Banner created successfully");
            // Reset form
            setImageUrl("");
            setEnableCountdown(false);
            setCountdownTarget(undefined);
            setCountdownLabel("");
            setCountdownSize("normal");
            setCountdownColor("gold");
            setPos({ x: 50, y: 50 });
        } catch (error) {
            toast.error("Failed to create banner");
            console.error(error);
        } finally {
            setLoading(false);
        }
    }

    const getSizeClasses = (size: string) => {
        switch (size) {
            case "small": return "text-sm px-3 py-1.5 min-w-[80px]";
            case "large": return "text-3xl px-8 py-4 min-w-[160px]";
            case "xl": return "text-5xl px-10 py-6 min-w-[200px]";
            default: return "text-xl px-5 py-2.5 min-w-[120px]";
        }
    };

    const getColorClasses = (color: string) => {
        return color === 'wine'
            ? "bg-primary/90 text-gold border-gold/30"
            : "bg-gold/90 text-primary-dark border-white/20";
    };

    return (
        <OrnateCard className="p-8 md:p-12">
            <div className="mb-10 text-center border-b border-gold/10 pb-6">
                <h2 className="text-3xl font-serif font-bold text-primary-dark">Add New Banner</h2>
                <p className="text-neutral-500 mt-2">Upload a high-quality banner for the homepage slider.</p>
            </div>

            <form action={handleSubmit} className="space-y-10">
                <div className="space-y-3">
                    <label className="text-base font-bold text-neutral-800 flex items-center gap-2">
                        Banner Image
                        <span className="text-xs font-normal text-gold bg-gold/5 px-2 py-0.5 rounded border border-gold/20">4:1 Ratio (Recommended)</span>
                    </label>
                    <ImageUpload
                        value={imageUrl}
                        onChange={setImageUrl}
                        aspectRatio={4 / 1}
                        disabled={loading}
                    />
                </div>

                {/* Countdown Logic */}
                <div className="bg-neutral-50 border border-gold/10 rounded-xl p-6 space-y-6">
                    <div className="flex items-center gap-3">
                        <input
                            type="checkbox"
                            id="enableCountdown"
                            checked={enableCountdown}
                            onChange={(e) => setEnableCountdown(e.target.checked)}
                            className="w-5 h-5 accent-gold cursor-pointer"
                        />
                        <label htmlFor="enableCountdown" className="text-base font-bold text-primary-dark cursor-pointer select-none">Enable Countdown Timer</label>
                    </div>

                    {enableCountdown && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-top-2">
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-neutral-700">Target Date & Time</label>
                                    <DateTimePicker
                                        date={countdownTarget}
                                        setDate={setCountdownTarget}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-neutral-700">Label <span className="text-neutral-400 font-normal">(Optional)</span></label>
                                    <Input
                                        placeholder="e.g. Starts In"
                                        value={countdownLabel}
                                        onChange={(e) => setCountdownLabel(e.target.value)}
                                        className="bg-white"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-neutral-700">Size</label>
                                    <select
                                        value={countdownSize}
                                        onChange={(e) => setCountdownSize(e.target.value)}
                                        className="w-full h-10 px-3 rounded-md border border-neutral-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-gold/50"
                                    >
                                        <option value="small">Small</option>
                                        <option value="normal">Normal</option>
                                        <option value="large">Large</option>
                                        <option value="xl">Extra Large</option>
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-neutral-700">Color</label>
                                    <select
                                        value={countdownColor}
                                        onChange={(e) => setCountdownColor(e.target.value)}
                                        className="w-full h-10 px-3 rounded-md border border-neutral-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-gold/50"
                                    >
                                        <option value="gold">Gold</option>
                                        <option value="wine">Wine (New)</option>
                                    </select>
                                </div>
                            </div>

                            {/* Visual Positioner */}
                            {imageUrl ? (
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-gold flex items-center justify-between">
                                        <span>Position Countdown (Click on preview)</span>
                                        <span className="text-neutral-400 font-mono text-xs">X: {pos.x.toFixed(0)}% Y: {pos.y.toFixed(0)}%</span>
                                    </label>
                                    <div
                                        className="relative w-full aspect-[4/1] rounded-lg overflow-hidden cursor-crosshair border-2 border-gold/30 shadow-lg group bg-neutral-900"
                                        onClick={(e) => {
                                            const rect = e.currentTarget.getBoundingClientRect();
                                            const x = ((e.clientX - rect.left) / rect.width) * 100;
                                            const y = ((e.clientY - rect.top) / rect.height) * 100;
                                            setPos({ x, y });
                                        }}
                                    >
                                        <img src={imageUrl} className="w-full h-full object-cover opacity-80" alt="Preview" />
                                        {/* Marker */}
                                        <div
                                            className={`absolute transform -translate-x-1/2 -translate-y-1/2 backdrop-blur-sm font-bold rounded-full shadow-lg border pointer-events-none transition-all flex flex-col items-center justify-center ${getSizeClasses(countdownSize)} ${getColorClasses(countdownColor)}`}
                                            style={{ left: `${pos.x}%`, top: `${pos.y}%` }}
                                        >
                                            {countdownLabel && <div className="text-[0.6em] uppercase font-bold tracking-widest opacity-80 mb-0.5">{countdownLabel}</div>}
                                            <div className="leading-none tracking-tight font-mono">00:00:00</div>
                                        </div>
                                        <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity flex items-center justify-center">
                                            <span className="text-white/50 text-sm font-bold bg-black/50 px-3 py-1 rounded">Click to set position</span>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="p-4 bg-yellow-50 text-yellow-800 text-sm rounded-lg border border-yellow-200">
                                    Upload an image first to position the countdown.
                                </div>
                            )}
                        </div>
                    )}
                </div>

                <div className="grid grid-cols-1 gap-8">
                    <div className="space-y-3">
                        <label className="text-base font-bold text-neutral-800">Redirect Link <span className="text-neutral-400 font-normal text-sm ml-1">(Optional)</span></label>
                        <Input
                            name="href"
                            placeholder="e.g., /events or https://external.com"
                            className="bg-white border-neutral-200 focus:border-gold focus:ring-4 focus:ring-gold/10 transition-all h-12 text-base shadow-sm"
                        />
                        <p className="text-xs text-neutral-500 ml-1">The user will be navigated here when clicking the banner.</p>
                    </div>

                    <div className="bg-gold/5 border border-gold/10 rounded-xl p-6 flex items-start gap-4">
                        <div className="relative flex items-center mt-1">
                            <input
                                type="checkbox"
                                name="isActive"
                                id="isActive"
                                className="peer h-6 w-6 cursor-pointer appearance-none rounded-md border-2 border-neutral-300 shadow-sm checked:bg-gold checked:border-gold transition-all"
                            />
                            <svg className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-white opacity-0 peer-checked:opacity-100" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                        </div>
                        <div className="space-y-1">
                            <label htmlFor="isActive" className="text-base font-bold text-neutral-800 cursor-pointer select-none">Set Active Immediately</label>
                            <p className="text-sm text-neutral-500">If checked, this banner will be visible on the homepage immediately after upload.</p>
                        </div>
                    </div>
                </div>

                <div className="pt-4 border-t border-neutral-100">
                    <GoldenButton disabled={loading} className="w-full text-lg py-4 shadow-xl shadow-gold/10">
                        {loading ? "Creating Banner..." : "Add Banner"}
                    </GoldenButton>
                </div>
            </form>
        </OrnateCard>
    );
}
