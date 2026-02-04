import { useState, useMemo } from "react";
import { createModule } from "@/app/actions/modules";
import * as LucideIcons from "lucide-react";
import {
    Loader2, Plus, Route, FileText, Sparkles, Key, X, Link2, UserPlus, ChevronDown, Search
} from "lucide-react";
import { cn } from "@/lib/utils";

// Generate list of all Lucide Icon names dynamically
// We filter for keys that start with an uppercase letter to only get Components
const ALL_ICON_NAMES = Object.keys(LucideIcons).filter(key =>
    /^[A-Z]/.test(key) && key !== "createLucideIcon"
);

// Slugify helper
function slugify(text: string): string {
    return text.toLowerCase().trim().replace(/[^\w\s-]/g, '').replace(/[\s_-]+/g, '-').replace(/^-+|-+$/g, '');
}

interface LinkInput {
    path: string;
    label: string;
}

export function ModuleForm({ onSuccess, initialData }: {
    onSuccess?: () => void,
    initialData?: {
        id: string; name: string; description?: string; icon?: string; links?: LinkInput[]; targetUserIts?: string[];
    }
}) {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [formData, setFormData] = useState({
        name: initialData?.name || "",
        description: initialData?.description || "",
        icon: initialData?.icon || ""
    });
    const [links, setLinks] = useState<LinkInput[]>(initialData?.links || [{ path: "", label: "" }]);
    const [assignedITS, setAssignedITS] = useState<string[]>(initialData?.targetUserIts || []);

    // User Search State
    const [userSearch, setUserSearch] = useState("");
    const [userResults, setUserResults] = useState<any[]>([]);
    const [isSearchingUsers, setIsSearchingUsers] = useState(false);

    // Icon Picker State
    const [showIconPicker, setShowIconPicker] = useState(false);
    const [iconSearchQuery, setIconSearchQuery] = useState("");

    const previewId = useMemo(() => slugify(formData.name), [formData.name]);

    // Filter icons based on search query
    // Memoize to avoid re-filtering on every render
    const filteredIcons = useMemo(() => {
        if (!iconSearchQuery) return ALL_ICON_NAMES.slice(0, 100); // Default to first 100 for performance
        const lowerQuery = iconSearchQuery.toLowerCase();
        return ALL_ICON_NAMES.filter(name => name.toLowerCase().includes(lowerQuery)).slice(0, 100); // Limit results
    }, [iconSearchQuery]);

    // Search Users effect
    const searchTimeout = useMemo(() => {
        let timeout: NodeJS.Timeout;
        return (query: string) => {
            clearTimeout(timeout);
            timeout = setTimeout(async () => {
                if (query.length > 1) {
                    setIsSearchingUsers(true);
                    try {
                        const { searchUsers } = await import("@/app/actions/modules");
                        const res = await searchUsers(query);
                        if (res.success) setUserResults(res.data || []);
                    } catch (err) { console.error(err); }
                    finally { setIsSearchingUsers(false); }
                } else {
                    setUserResults([]);
                }
            }, 300);
        };
    }, []);

    const handleUserSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        setUserSearch(val);
        searchTimeout(val);
    };

    const addLink = () => setLinks([...links, { path: "", label: "" }]);
    const removeLink = (index: number) => { if (links.length > 1) setLinks(links.filter((_, i) => i !== index)); };
    const updateLink = (index: number, field: keyof LinkInput, value: string) => {
        const newLinks = [...links];
        newLinks[index][field] = value;
        setLinks(newLinks);
    };

    const handleAddUser = (user: { its: string | null }) => {
        if (user.its && !assignedITS.includes(user.its)) {
            setAssignedITS([...assignedITS, user.its]);
            setUserSearch("");
            setUserResults([]);
        }
    };
    const addManualITS = (e: React.FormEvent) => {
        e.preventDefault();
        const trimmed = userSearch.trim();
        if (trimmed && /^\d+$/.test(trimmed) && !assignedITS.includes(trimmed)) {
            setAssignedITS([...assignedITS, trimmed]);
            setUserSearch("");
        }
    };
    const removeITS = (its: string) => setAssignedITS(assignedITS.filter(i => i !== its));

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);

        const validLinks = links.filter(l => l.path.trim() !== "");

        let result;
        const payload = {
            name: formData.name,
            description: formData.description || undefined,
            icon: formData.icon || undefined,
            links: validLinks.map((l, i) => ({ path: l.path.trim(), label: l.label.trim() || undefined, order: i }))
        };

        if (initialData?.id) {
            const { updateModule } = await import("@/app/actions/modules");
            result = await updateModule(initialData.id, payload);
        } else {
            result = await createModule({ ...payload, targetUserIts: assignedITS.length > 0 ? assignedITS : undefined });
        }

        if (result.success) {
            setFormData({ name: "", description: "", icon: "" });
            setLinks([{ path: "", label: "" }]);
            setAssignedITS([]);
            if (onSuccess) onSuccess();
        } else {
            setError(result.error || "Failed to save module");
        }
        setIsLoading(false);
    };

    // Get the selected icon component safely
    const SelectedIcon = formData.icon ? (LucideIcons as any)[formData.icon] : null;
    const DefaultIconDisplay = FileText;

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-2 rounded-lg text-sm">{error}</div>}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-1">
                        <Sparkles className="w-4 h-4 inline mr-1" /> Module Name *
                    </label>
                    <input
                        type="text"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder="e.g., Manage Banners"
                        required
                        className="w-full px-4 py-2 border border-neutral-200 rounded-lg focus:ring-2 focus:ring-gold/50 focus:border-gold outline-none"
                    />
                    {formData.name && (
                        <div className="mt-2 flex items-center gap-2 text-sm">
                            <Key className="w-3.5 h-3.5 text-gold" />
                            <span className="text-neutral-500">ID:</span>
                            <code className="px-2 py-0.5 bg-gold/10 text-gold border border-gold/20 rounded font-mono text-xs">{previewId}</code>
                        </div>
                    )}
                </div>

                {/* Icon Picker Field */}
                <div className="relative">
                    <label className="block text-sm font-medium text-neutral-700 mb-1">
                        Display Icon
                    </label>
                    <button
                        type="button"
                        onClick={() => setShowIconPicker(!showIconPicker)}
                        className="w-full flex items-center justify-between px-4 py-2 border border-neutral-200 rounded-lg bg-white hover:border-gold/50 focus:ring-2 focus:ring-gold/50 outline-none transition-all"
                    >
                        <div className="flex items-center gap-2 text-neutral-700">
                            {SelectedIcon ? (
                                <>
                                    <SelectedIcon className="w-5 h-5 text-gold" />
                                    <span className="font-medium">{formData.icon}</span>
                                </>
                            ) : (
                                <span className="text-neutral-400">Select from {ALL_ICON_NAMES.length} icons...</span>
                            )}
                        </div>
                        <ChevronDown className={cn("w-4 h-4 text-neutral-400 transition-transform", showIconPicker ? "rotate-180" : "")} />
                    </button>

                    {showIconPicker && (
                        <div className="absolute z-50 right-0 top-full mt-2 w-full md:w-80 bg-white border border-gold/20 rounded-xl shadow-xl p-3 animate-in fade-in slide-in-from-top-2">
                            {/* Search Bar for Icons */}
                            <div className="mb-2 relative">
                                <Search className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-neutral-400" />
                                <input
                                    type="text"
                                    value={iconSearchQuery}
                                    onChange={(e) => setIconSearchQuery(e.target.value)}
                                    placeholder="Search icons..."
                                    className="w-full pl-8 pr-3 py-2 text-xs border border-neutral-200 rounded-lg focus:outline-none focus:border-gold"
                                    autoFocus
                                />
                            </div>

                            <div className="grid grid-cols-5 gap-2 max-h-60 overflow-y-auto custom-scrollbar p-1">
                                {filteredIcons.map((name) => {
                                    const IconComp = (LucideIcons as any)[name];
                                    if (!IconComp) return null;
                                    return (
                                        <button
                                            key={name}
                                            type="button"
                                            onClick={() => {
                                                setFormData({ ...formData, icon: name });
                                                setShowIconPicker(false);
                                            }}
                                            className={cn(
                                                "flex flex-col items-center justify-center gap-1 p-2 rounded-lg border transition-all hover:shadow-md",
                                                formData.icon === name
                                                    ? "bg-gold/10 border-gold/50 text-primary-dark"
                                                    : "bg-neutral-50 border-transparent text-neutral-500 hover:bg-white hover:border-gold/20 hover:text-gold"
                                            )}
                                            title={name}
                                        >
                                            <IconComp className="w-6 h-6" />
                                        </button>
                                    );
                                })}
                            </div>
                            <div className="mt-2 pt-2 border-t border-neutral-100 text-[10px] text-center text-neutral-400 flex justify-between px-2">
                                <span>{filteredIcons.length} shown</span>
                                <span>Total: {ALL_ICON_NAMES.length}</span>
                            </div>
                        </div>
                    )}
                    {/* Fallback Click Outside Layer could go here if needed, but simplistic toggling is okay for now */}
                </div>
            </div>

            {/* Links Section */}
            <div className="space-y-3">
                <div className="flex items-center justify-between">
                    <label className="flex items-center gap-1 text-sm font-medium text-neutral-700">
                        <Link2 className="w-4 h-4" /> Module Links (optional)
                    </label>
                    <button type="button" onClick={addLink} className="text-xs text-primary hover:text-primary-dark flex items-center gap-1">
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
                                    placeholder="/admin/banners"
                                    className="w-full px-3 py-2 border border-neutral-200 rounded-lg focus:ring-2 focus:ring-gold/50 text-sm"
                                />
                                <input
                                    type="text"
                                    value={link.label}
                                    onChange={(e) => updateLink(index, "label", e.target.value)}
                                    placeholder="Label"
                                    className="w-full px-3 py-2 border border-neutral-200 rounded-lg focus:ring-2 focus:ring-gold/50 text-sm"
                                />
                            </div>
                            {links.length > 1 && (
                                <button type="button" onClick={() => removeLink(index)} className="p-2 text-neutral-400 hover:text-red-500 hover:bg-red-50 rounded-lg">
                                    <X className="w-4 h-4" />
                                </button>
                            )}
                        </div>
                    ))}
                </div>
                <p className="text-xs text-neutral-400">Use [param] for dynamic routes, e.g., /admin/banners/[id]</p>
            </div>

            <div className="h-px bg-neutral-100 my-4" />

            {/* Assign Users Section - CHECK if Create Mode Only */}
            {!initialData?.id && (
                <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-1">
                        <UserPlus className="w-4 h-4 inline mr-1" />
                        Assign to Users (Search Name or Enter ITS)
                    </label>
                    <div className="relative mb-2">
                        <input
                            type="text"
                            value={userSearch}
                            onChange={handleUserSearchChange}
                            onKeyDown={(e) => e.key === 'Enter' && addManualITS(e)}
                            placeholder="Type Name, Username or ITS..."
                            className="w-full px-4 py-2 border border-neutral-200 rounded-lg focus:ring-2 focus:ring-gold/50 focus:border-gold outline-none"
                        />
                        {isSearchingUsers && (
                            <div className="absolute right-3 top-2.5">
                                <Loader2 className="w-5 h-5 animate-spin text-gold" />
                            </div>
                        )}

                        {/* Search Results Dropdown */}
                        {userResults.length > 0 && (
                            <div className="absolute z-10 w-full mt-1 bg-white border border-neutral-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                                {userResults.map((u: any) => (
                                    <button
                                        key={u.id}
                                        type="button"
                                        onClick={() => handleAddUser(u)}
                                        className="w-full text-left px-4 py-2 hover:bg-gold/10 flex justify-between items-center border-b border-neutral-50 last:border-0"
                                    >
                                        <div>
                                            <p className="text-sm font-bold text-neutral-800">{u.name || u.username}</p>
                                            <p className="text-xs text-neutral-500 font-mono">{u.its || "No ITS"}</p>
                                        </div>
                                        {!assignedITS.includes(u.its) ? (
                                            <Plus className="w-4 h-4 text-gold" />
                                        ) : (
                                            <span className="text-xs text-green-600 bg-green-50 px-2 py-0.5 rounded">Selected</span>
                                        )}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {assignedITS.length > 0 && (
                        <div className="flex flex-wrap gap-2 p-3 bg-neutral-50 rounded-lg border border-neutral-100">
                            {assignedITS.map(its => (
                                <span key={its} className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-white border border-neutral-200 rounded text-xs font-mono shadow-sm">
                                    {its}
                                    <button type="button" onClick={() => removeITS(its)} className="text-neutral-400 hover:text-red-500">
                                        <X className="w-3 h-3" />
                                    </button>
                                </span>
                            ))}
                        </div>
                    )}
                </div>
            )}

            <div className="h-px bg-neutral-100 my-4" />

            <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">
                    <FileText className="w-4 h-4 inline mr-1" /> Description (optional)
                </label>
                <input
                    type="text"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Brief description"
                    className="w-full px-4 py-2 border border-neutral-200 rounded-lg focus:ring-2 focus:ring-gold/50 focus:border-gold outline-none"
                />
            </div>

            <button
                type="submit"
                disabled={isLoading}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-white font-bold rounded-lg hover:bg-primary-dark transition-colors disabled:opacity-50"
            >
                {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                {initialData?.id ? "Update Module" : "Add Module & Assign"}
            </button>
        </form>
    );
}
