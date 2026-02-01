"use client";

import { useState, useMemo, useEffect } from "react";
import { updateUserModules } from "@/app/actions/modules";
import { Search, Save, Loader2, Check, Route } from "lucide-react";

interface ModuleLink {
    id: string;
    path: string;
    label: string | null;
}

interface Module {
    id: string;
    name: string;
    links: ModuleLink[];
    description: string | null;
    icon: string | null;
}

interface Props {
    userId: string;
    allModules: Module[];
    grantedModuleIds: string[];
    onSave?: () => void;
}

export function UserModuleEditor({ userId, allModules, grantedModuleIds, onSave }: Props) {
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set(grantedModuleIds));
    const [search, setSearch] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [saved, setSaved] = useState(false);

    // Reset state when userId changes
    useEffect(() => {
        setSelectedIds(new Set(grantedModuleIds));
        setSaved(false);
        setSearch("");
    }, [userId, grantedModuleIds]);

    const filteredModules = useMemo(() => {
        if (!search.trim()) return allModules;
        const q = search.toLowerCase();
        return allModules.filter(m =>
            m.name.toLowerCase().includes(q) ||
            m.links.some(l => l.path.toLowerCase().includes(q))
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
        const visibleIds = filteredModules.map(m => m.id);
        const newSet = new Set(selectedIds);
        visibleIds.forEach(id => newSet.add(id));
        setSelectedIds(newSet);
        setSaved(false);
    };

    const deselectAll = () => {
        const visibleIds = new Set(filteredModules.map(m => m.id));
        const newSet = new Set(Array.from(selectedIds).filter(id => !visibleIds.has(id)));
        setSelectedIds(newSet);
        setSaved(false);
    };

    const handleSave = async () => {
        setIsLoading(true);
        const result = await updateUserModules(userId, Array.from(selectedIds));
        if (result.success) {
            setSaved(true);
            if (onSave) onSave();
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
            <div className="flex flex-col gap-3">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                    <input
                        type="text"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search available modules..."
                        className="w-full pl-10 pr-4 py-2 border border-neutral-200 rounded-lg focus:ring-2 focus:ring-gold/50 focus:border-gold outline-none text-sm"
                    />
                </div>
                <div className="flex gap-2 text-xs">
                    <button
                        onClick={selectAll}
                        className="flex-1 px-2 py-1.5 font-medium text-primary bg-primary/5 hover:bg-primary/10 rounded transition-colors"
                    >
                        Select All Visible
                    </button>
                    <button
                        onClick={deselectAll}
                        className="flex-1 px-2 py-1.5 font-medium text-neutral-600 bg-neutral-100 hover:bg-neutral-200 rounded transition-colors"
                    >
                        Deselect Visible
                    </button>
                </div>
            </div>

            {/* Module List */}
            <div className="border border-neutral-200 rounded-lg divide-y divide-neutral-100 max-h-[60vh] overflow-y-auto">
                {filteredModules.length === 0 ? (
                    <div className="p-8 text-center text-neutral-400">
                        {search ? "No matching modules" : "No modules found"}
                    </div>
                ) : (
                    filteredModules.map((module) => (
                        <label
                            key={module.id}
                            className={`flex items-start gap-3 p-3 hover:bg-gold/5 cursor-pointer transition-colors ${selectedIds.has(module.id) ? 'bg-gold/5' : ''
                                }`}
                        >
                            <input
                                type="checkbox"
                                checked={selectedIds.has(module.id)}
                                onChange={() => toggleModule(module.id)}
                                className="mt-1 w-4 h-4 rounded border-neutral-300 text-primary focus:ring-gold/50"
                            />
                            <div className="flex-1 min-w-0">
                                <span className="font-medium text-sm text-neutral-800 block">{module.name}</span>
                                {module.description && (
                                    <span className="text-xs text-neutral-500 block line-clamp-1">{module.description}</span>
                                )}
                                <span className="text-[10px] text-neutral-400 block font-mono mt-0.5">{module.id}</span>
                            </div>
                        </label>
                    ))
                )}
            </div>

            {/* Save Button */}
            <div className="flex items-center justify-between pt-4 border-t border-neutral-100">
                <span className="text-xs text-neutral-500">
                    {selectedIds.size} selected
                </span>
                <button
                    onClick={handleSave}
                    disabled={isLoading || (!hasChanges && !saved)}
                    className="inline-flex items-center gap-2 px-6 py-2.5 bg-primary text-white font-bold rounded-lg hover:bg-primary-dark transition-colors disabled:opacity-50 text-sm"
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
