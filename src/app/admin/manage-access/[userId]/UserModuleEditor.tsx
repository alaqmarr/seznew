"use client";

import { useState, useMemo } from "react";
import { updateUserModules } from "@/app/actions/modules";
import { Search, Save, Loader2, Check, Route } from "lucide-react";

interface Module {
    id: string;
    name: string;
    path: string | null;  // Path is optional
    elementId: string | null;
    description: string | null;
    icon: string | null;
}

interface Props {
    userId: string;
    allModules: Module[];
    grantedModuleIds: string[];
}

export function UserModuleEditor({ userId, allModules, grantedModuleIds }: Props) {
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set(grantedModuleIds));
    const [search, setSearch] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [saved, setSaved] = useState(false);

    const filteredModules = useMemo(() => {
        if (!search.trim()) return allModules;
        const q = search.toLowerCase();
        return allModules.filter(m =>
            m.name.toLowerCase().includes(q) ||
            (m.path && m.path.toLowerCase().includes(q))
        );
    }, [allModules, search]);

    const toggleModule = (id: string) => {
        const newSet = new Set(selectedIds);
        if (newSet.has(id)) {
            newSet.delete(id);
        } else {
            newSet.add(id);
        }
        setSelectedIds(newSet);
        setSaved(false);
    };

    const selectAll = () => {
        setSelectedIds(new Set(allModules.map(m => m.id)));
        setSaved(false);
    };

    const deselectAll = () => {
        setSelectedIds(new Set());
        setSaved(false);
    };

    const handleSave = async () => {
        setIsLoading(true);
        const result = await updateUserModules(userId, Array.from(selectedIds));
        if (result.success) {
            setSaved(true);
        } else {
            alert(result.error);
        }
        setIsLoading(false);
    };

    const hasChanges = useMemo(() => {
        if (grantedModuleIds.length !== selectedIds.size) return true;
        return grantedModuleIds.some(id => !selectedIds.has(id));
    }, [grantedModuleIds, selectedIds]);

    return (
        <div className="space-y-4">
            {/* Search & Actions */}
            <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                    <input
                        type="text"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search modules..."
                        className="w-full pl-10 pr-4 py-2 border border-neutral-200 rounded-lg focus:ring-2 focus:ring-gold/50 focus:border-gold outline-none"
                    />
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={selectAll}
                        className="px-3 py-2 text-sm font-medium text-primary hover:bg-primary/10 rounded-lg transition-colors"
                    >
                        Select All
                    </button>
                    <button
                        onClick={deselectAll}
                        className="px-3 py-2 text-sm font-medium text-neutral-600 hover:bg-neutral-100 rounded-lg transition-colors"
                    >
                        Deselect All
                    </button>
                </div>
            </div>

            {/* Module List */}
            <div className="border border-neutral-200 rounded-lg divide-y divide-neutral-100 max-h-[400px] overflow-y-auto">
                {filteredModules.length === 0 ? (
                    <div className="p-8 text-center text-neutral-400">
                        {search ? "No modules match your search" : "No modules available"}
                    </div>
                ) : (
                    filteredModules.map((module) => (
                        <label
                            key={module.id}
                            className="flex items-center gap-4 p-4 hover:bg-gold/5 cursor-pointer transition-colors"
                        >
                            <input
                                type="checkbox"
                                checked={selectedIds.has(module.id)}
                                onChange={() => toggleModule(module.id)}
                                className="w-5 h-5 rounded border-neutral-300 text-primary focus:ring-gold/50"
                            />
                            <div className="flex-1 min-w-0">
                                <span className="font-medium text-neutral-800 block">{module.name}</span>
                                {module.path && (
                                    <span className="inline-flex items-center gap-1 text-xs text-neutral-500">
                                        <Route className="w-3 h-3" />
                                        <code className="bg-neutral-100 px-1 rounded">{module.path}</code>
                                    </span>
                                )}
                            </div>
                        </label>
                    ))
                )}
            </div>

            {/* Save Button */}
            <div className="flex items-center justify-between pt-4 border-t border-neutral-100">
                <span className="text-sm text-neutral-500">
                    {selectedIds.size} module{selectedIds.size !== 1 ? 's' : ''} selected
                </span>
                <button
                    onClick={handleSave}
                    disabled={isLoading || (!hasChanges && !saved)}
                    className="inline-flex items-center gap-2 px-6 py-2.5 bg-primary text-white font-bold rounded-lg hover:bg-primary-dark transition-colors disabled:opacity-50"
                >
                    {isLoading ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                    ) : saved ? (
                        <Check className="w-4 h-4" />
                    ) : (
                        <Save className="w-4 h-4" />
                    )}
                    {saved ? "Saved!" : "Save Changes"}
                </button>
            </div>
        </div>
    );
}
