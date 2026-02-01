"use client";

import { useState } from "react";
import { deleteModule, deleteModuleLink, addModuleLink } from "@/app/actions/modules";
import { Trash2, Route, Users, Loader2, Plus, X, Link2 } from "lucide-react";

interface ModuleLink {
    id: string;
    path: string;
    label: string | null;
}

interface Module {
    id: string;
    name: string;
    description: string | null;
    icon: string | null;
    links: ModuleLink[];
    _count: { userAccess: number };
}

export function ModuleList({ modules }: { modules: Module[] }) {
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const [deletingLinkId, setDeletingLinkId] = useState<string | null>(null);
    const [addingLinkTo, setAddingLinkTo] = useState<string | null>(null);
    const [newLink, setNewLink] = useState({ path: "", label: "" });

    const handleDelete = async (id: string) => {
        if (!confirm("Delete this module? Users with access will lose it.")) return;
        setDeletingId(id);
        await deleteModule(id);
        setDeletingId(null);
    };

    const handleDeleteLink = async (linkId: string) => {
        setDeletingLinkId(linkId);
        await deleteModuleLink(linkId);
        setDeletingLinkId(null);
    };

    const handleAddLink = async (moduleId: string) => {
        if (!newLink.path.trim()) return;
        await addModuleLink(moduleId, {
            path: newLink.path.trim(),
            label: newLink.label.trim() || undefined,
        });
        setNewLink({ path: "", label: "" });
        setAddingLinkTo(null);
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
                    className="p-4 hover:bg-gold/5 transition-colors"
                >
                    <div className="flex items-start justify-between gap-4 mb-3">
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                                <span className="font-bold text-primary-dark">{module.name}</span>
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-neutral-100 text-neutral-600 text-xs rounded-full">
                                    <Users className="w-3 h-3" />
                                    {module._count.userAccess}
                                </span>
                            </div>
                            {module.description && (
                                <p className="text-xs text-neutral-400">{module.description}</p>
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

                    {/* Links */}
                    <div className="ml-4 space-y-1">
                        <div className="flex items-center gap-2 text-xs text-neutral-500 mb-2">
                            <Link2 className="w-3.5 h-3.5" />
                            <span className="font-medium">Links ({module.links.length})</span>
                        </div>

                        {module.links.map((link) => (
                            <div
                                key={link.id}
                                className="flex items-center justify-between gap-2 py-1 px-2 bg-neutral-50 rounded group"
                            >
                                <div className="flex items-center gap-2 text-sm min-w-0">
                                    <Route className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
                                    <code className="text-xs bg-white px-1.5 py-0.5 rounded border truncate">
                                        {link.path}
                                    </code>
                                    {link.label && (
                                        <span className="text-neutral-500 text-xs truncate">
                                            — {link.label}
                                        </span>
                                    )}
                                </div>
                                <button
                                    onClick={() => handleDeleteLink(link.id)}
                                    disabled={deletingLinkId === link.id}
                                    className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-red-100 text-neutral-400 hover:text-red-500 transition-all"
                                >
                                    {deletingLinkId === link.id ? (
                                        <Loader2 className="w-3 h-3 animate-spin" />
                                    ) : (
                                        <X className="w-3 h-3" />
                                    )}
                                </button>
                            </div>
                        ))}

                        {/* Add Link Form */}
                        {addingLinkTo === module.id ? (
                            <div className="flex items-center gap-2 mt-2">
                                <input
                                    type="text"
                                    value={newLink.path}
                                    onChange={(e) => setNewLink({ ...newLink, path: e.target.value })}
                                    placeholder="/path/[id]"
                                    className="flex-1 px-2 py-1 text-sm border rounded focus:ring-1 focus:ring-gold outline-none"
                                />
                                <input
                                    type="text"
                                    value={newLink.label}
                                    onChange={(e) => setNewLink({ ...newLink, label: e.target.value })}
                                    placeholder="Label"
                                    className="w-24 px-2 py-1 text-sm border rounded focus:ring-1 focus:ring-gold outline-none"
                                />
                                <button
                                    onClick={() => handleAddLink(module.id)}
                                    className="p-1.5 bg-primary text-white rounded hover:bg-primary-dark"
                                >
                                    <Plus className="w-3 h-3" />
                                </button>
                                <button
                                    onClick={() => {
                                        setAddingLinkTo(null);
                                        setNewLink({ path: "", label: "" });
                                    }}
                                    className="p-1.5 text-neutral-400 hover:text-neutral-600"
                                >
                                    <X className="w-3 h-3" />
                                </button>
                            </div>
                        ) : (
                            <button
                                onClick={() => setAddingLinkTo(module.id)}
                                className="flex items-center gap-1 text-xs text-primary hover:text-primary-dark mt-1"
                            >
                                <Plus className="w-3 h-3" /> Add link
                            </button>
                        )}
                    </div>
                </div>
            ))}
        </div>
    );
}
