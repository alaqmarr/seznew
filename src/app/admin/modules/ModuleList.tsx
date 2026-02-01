"use client";

import { useState } from "react";
import { deleteModule } from "@/app/actions/modules";
import { Trash2, Route, Hash, Users, Loader2 } from "lucide-react";

interface Module {
    id: string;
    name: string;
    path: string | null;  // Path is optional
    elementId: string | null;
    description: string | null;
    icon: string | null;
    _count: { userAccess: number };
}

export function ModuleList({ modules }: { modules: Module[] }) {
    const [deletingId, setDeletingId] = useState<string | null>(null);

    const handleDelete = async (id: string) => {
        if (!confirm("Delete this module? Users with access will lose it.")) return;
        setDeletingId(id);
        await deleteModule(id);
        setDeletingId(null);
    };

    if (modules.length === 0) {
        return (
            <div className="text-center py-16 text-neutral-400">
                <p className="font-serif text-lg text-neutral-600 mb-1">No modules created yet</p>
                <p className="text-sm">Add your first module using the form above.</p>
            </div>
        );
    }

    return (
        <div className="divide-y divide-neutral-100">
            {modules.map((module) => (
                <div
                    key={module.id}
                    className="p-4 hover:bg-gold/5 transition-colors flex items-center justify-between gap-4"
                >
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                            <span className="font-bold text-primary-dark">{module.name}</span>
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-neutral-100 text-neutral-600 text-xs rounded-full">
                                <Users className="w-3 h-3" />
                                {module._count.userAccess}
                            </span>
                        </div>
                        <div className="flex flex-wrap items-center gap-3 text-sm text-neutral-500">
                            {module.path && (
                                <span className="inline-flex items-center gap-1">
                                    <Route className="w-3.5 h-3.5" />
                                    <code className="text-xs bg-neutral-100 px-1.5 py-0.5 rounded">{module.path}</code>
                                </span>
                            )}
                            {module.elementId && (
                                <span className="inline-flex items-center gap-1">
                                    <Hash className="w-3.5 h-3.5" />
                                    <code className="text-xs bg-neutral-100 px-1.5 py-0.5 rounded">{module.elementId}</code>
                                </span>
                            )}
                        </div>
                        {module.description && (
                            <p className="text-xs text-neutral-400 mt-1">{module.description}</p>
                        )}
                    </div>
                    <button
                        onClick={() => handleDelete(module.id)}
                        disabled={deletingId === module.id}
                        className="p-2 rounded-lg hover:bg-red-50 text-neutral-400 hover:text-red-500 transition-colors disabled:opacity-50"
                    >
                        {deletingId === module.id ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                            <Trash2 className="w-4 h-4" />
                        )}
                    </button>
                </div>
            ))}
        </div>
    );
}
