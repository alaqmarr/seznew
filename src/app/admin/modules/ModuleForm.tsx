"use client";

import { useState, useMemo } from "react";
import { createModule } from "@/app/actions/modules";
import { Loader2, Plus, Route, Hash, FileText, Sparkles, Key } from "lucide-react";

// Slugify helper - matches server-side logic
function slugify(text: string): string {
    return text
        .toLowerCase()
        .trim()
        .replace(/[^\w\s-]/g, '')
        .replace(/[\s_-]+/g, '-')
        .replace(/^-+|-+$/g, '');
}

export function ModuleForm() {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [formData, setFormData] = useState({
        name: "",
        path: "",
        elementId: "",
        description: "",
        icon: ""
    });

    // Real-time ID preview
    const previewId = useMemo(() => slugify(formData.name), [formData.name]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);

        const result = await createModule({
            name: formData.name,
            path: formData.path,
            elementId: formData.elementId || undefined,
            description: formData.description || undefined,
            icon: formData.icon || undefined
        });

        if (result.success) {
            setFormData({ name: "", path: "", elementId: "", description: "", icon: "" });
        } else {
            setError(result.error || "Failed to create module");
        }
        setIsLoading(false);
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-2 rounded-lg text-sm">
                    {error}
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-1">
                        <Sparkles className="w-4 h-4 inline mr-1" />
                        Module Name *
                    </label>
                    <input
                        type="text"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder="e.g., Manage Banners"
                        required
                        className="w-full px-4 py-2 border border-neutral-200 rounded-lg focus:ring-2 focus:ring-gold/50 focus:border-gold outline-none"
                    />
                    {/* Real-time ID Preview */}
                    {formData.name && (
                        <div className="mt-2 flex items-center gap-2 text-sm">
                            <Key className="w-3.5 h-3.5 text-gold" />
                            <span className="text-neutral-500">ID:</span>
                            <code className="px-2 py-0.5 bg-gold/10 text-gold border border-gold/20 rounded font-mono text-xs">
                                {previewId}
                            </code>
                        </div>
                    )}
                </div>
                <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-1">
                        <Route className="w-4 h-4 inline mr-1" />
                        Path (optional)
                    </label>
                    <input
                        type="text"
                        value={formData.path}
                        onChange={(e) => setFormData({ ...formData, path: e.target.value })}
                        placeholder="e.g., /admin/banners"
                        className="w-full px-4 py-2 border border-neutral-200 rounded-lg focus:ring-2 focus:ring-gold/50 focus:border-gold outline-none"
                    />
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-1">
                        <Hash className="w-4 h-4 inline mr-1" />
                        Element ID (optional)
                    </label>
                    <input
                        type="text"
                        value={formData.elementId}
                        onChange={(e) => setFormData({ ...formData, elementId: e.target.value })}
                        placeholder="e.g., banner-delete-btn"
                        className="w-full px-4 py-2 border border-neutral-200 rounded-lg focus:ring-2 focus:ring-gold/50 focus:border-gold outline-none"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-1">
                        Icon (Lucide name)
                    </label>
                    <input
                        type="text"
                        value={formData.icon}
                        onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                        placeholder="e.g., LayoutDashboard"
                        className="w-full px-4 py-2 border border-neutral-200 rounded-lg focus:ring-2 focus:ring-gold/50 focus:border-gold outline-none"
                    />
                </div>
            </div>

            <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">
                    <FileText className="w-4 h-4 inline mr-1" />
                    Description (optional)
                </label>
                <input
                    type="text"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Brief description of this module"
                    className="w-full px-4 py-2 border border-neutral-200 rounded-lg focus:ring-2 focus:ring-gold/50 focus:border-gold outline-none"
                />
            </div>

            <button
                type="submit"
                disabled={isLoading}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-white font-bold rounded-lg hover:bg-primary-dark transition-colors disabled:opacity-50"
            >
                {isLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                    <Plus className="w-4 h-4" />
                )}
                Add Module
            </button>
        </form>
    );
}
