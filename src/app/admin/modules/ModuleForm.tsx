"use client";

import { useState, useMemo } from "react";
import { createModule } from "@/app/actions/modules";
import { Loader2, Plus, Route, FileText, Sparkles, Key, X, Link2 } from "lucide-react";

// Slugify helper - matches server-side logic
function slugify(text: string): string {
    return text
        .toLowerCase()
        .trim()
        .replace(/[^\w\s-]/g, '')
        .replace(/[\s_-]+/g, '-')
        .replace(/^-+|-+$/g, '');
}

interface LinkInput {
    path: string;
    label: string;
}

export function ModuleForm() {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [formData, setFormData] = useState({
        name: "",
        description: "",
        icon: ""
    });
    const [links, setLinks] = useState<LinkInput[]>([{ path: "", label: "" }]);

    // Real-time ID preview
    const previewId = useMemo(() => slugify(formData.name), [formData.name]);

    const addLink = () => {
        setLinks([...links, { path: "", label: "" }]);
    };

    const removeLink = (index: number) => {
        if (links.length > 1) {
            setLinks(links.filter((_, i) => i !== index));
        }
    };

    const updateLink = (index: number, field: keyof LinkInput, value: string) => {
        const newLinks = [...links];
        newLinks[index][field] = value;
        setLinks(newLinks);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);

        // Filter out empty links (links are optional)
        const validLinks = links.filter(l => l.path.trim() !== "");

        const result = await createModule({
            name: formData.name,
            links: validLinks.map((l, i) => ({
                path: l.path.trim(),
                label: l.label.trim() || undefined,
                order: i
            })),
            description: formData.description || undefined,
            icon: formData.icon || undefined
        });

        if (result.success) {
            setFormData({ name: "", description: "", icon: "" });
            setLinks([{ path: "", label: "" }]);
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

            {/* Links Section */}
            <div className="space-y-3">
                <div className="flex items-center justify-between">
                    <label className="flex items-center gap-1 text-sm font-medium text-neutral-700">
                        <Link2 className="w-4 h-4" />
                        Module Links (optional)
                    </label>
                    <button
                        type="button"
                        onClick={addLink}
                        className="text-xs text-primary hover:text-primary-dark flex items-center gap-1"
                    >
                        <Plus className="w-3 h-3" /> Add Link
                    </button>
                </div>

                <div className="space-y-2">
                    {links.map((link, index) => (
                        <div key={index} className="flex items-center gap-2">
                            <div className="flex-1 grid grid-cols-2 gap-2">
                                <input
                                    type="text"
                                    value={link.path}
                                    onChange={(e) => updateLink(index, "path", e.target.value)}
                                    placeholder="/admin/banners or /admin/banners/[id]"
                                    className="w-full px-3 py-2 border border-neutral-200 rounded-lg focus:ring-2 focus:ring-gold/50 focus:border-gold outline-none text-sm"
                                />
                                <input
                                    type="text"
                                    value={link.label}
                                    onChange={(e) => updateLink(index, "label", e.target.value)}
                                    placeholder="Label (optional)"
                                    className="w-full px-3 py-2 border border-neutral-200 rounded-lg focus:ring-2 focus:ring-gold/50 focus:border-gold outline-none text-sm"
                                />
                            </div>
                            {links.length > 1 && (
                                <button
                                    type="button"
                                    onClick={() => removeLink(index)}
                                    className="p-2 text-neutral-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            )}
                        </div>
                    ))}
                </div>
                <p className="text-xs text-neutral-400">
                    Use [param] for dynamic routes, e.g., /admin/banners/[id] matches /admin/banners/any-id
                </p>
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
