"use client";

import { useState } from "react";
import { createHallModule } from "@/app/actions/modules";
import { Check, Plus, Loader2, Utensils } from "lucide-react";

interface Status {
    hallName: string;
    moduleId: string;
    exists: boolean;
    existingName: string | null;
}

export function HallModuleGenerator({ initialStatus }: { initialStatus: Status[] }) {
    const [status, setStatus] = useState<Status[]>(initialStatus);
    const [loadingIds, setLoadingIds] = useState<Set<string>>(new Set());

    const handleCreate = async (hallName: string, moduleId: string) => {
        setLoadingIds(prev => new Set(prev).add(moduleId));

        const result = await createHallModule(hallName);

        if (result.success) {
            // Update local state
            setStatus(prev => prev.map(s =>
                s.moduleId === moduleId
                    ? { ...s, exists: true, existingName: `Manage ${hallName}` }
                    : s
            ));
        } else {
            alert(result.error || "Failed to create module");
        }

        setLoadingIds(prev => {
            const next = new Set(prev);
            next.delete(moduleId);
            return next;
        });
    };

    if (initialStatus.length === 0) return null;

    return (
        <div className="space-y-3">
            <div className="flex items-center gap-2 mb-4 p-3 bg-blue-50 text-blue-800 rounded-lg text-sm border border-blue-100">
                <Utensils className="w-4 h-4 text-blue-600" />
                <p>
                    <strong>Auto-Generator:</strong> Quickly create permission modules for each hall.
                    These modules (e.g., <code>hall-1st-floor</code>) allow users to update thaal counts for that specific floor.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {status.map((item) => (
                    <div
                        key={item.moduleId}
                        className={`flex items-center justify-between p-3 rounded-lg border transition-colors ${item.exists
                                ? "bg-emerald-50/50 border-emerald-100"
                                : "bg-white border-neutral-200 hover:border-gold/50"
                            }`}
                    >
                        <div>
                            <p className="font-bold text-sm text-neutral-800">{item.hallName}</p>
                            <code className="text-[10px] text-neutral-400 font-mono bg-neutral-100 px-1 py-0.5 rounded">
                                {item.moduleId}
                            </code>
                        </div>

                        {item.exists ? (
                            <span className="flex items-center gap-1 text-xs font-bold text-emerald-600 bg-emerald-100 px-2 py-1 rounded-full">
                                <Check className="w-3 h-3" /> Created
                            </span>
                        ) : (
                            <button
                                onClick={() => handleCreate(item.hallName, item.moduleId)}
                                disabled={loadingIds.has(item.moduleId)}
                                className="flex items-center gap-1 text-xs font-bold text-white bg-primary hover:bg-primary-dark px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50"
                            >
                                {loadingIds.has(item.moduleId) ? (
                                    <Loader2 className="w-3 h-3 animate-spin" />
                                ) : (
                                    <Plus className="w-3 h-3" />
                                )}
                                Create Module
                            </button>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}
