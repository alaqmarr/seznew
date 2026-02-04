"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Loader2 } from "lucide-react";
import { OrnateCard } from "@/components/ui/premium-components";

export function SearchUserClient({ error }: { error?: string }) {
    const [query, setQuery] = useState("");
    const [results, setResults] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [hasSearched, setHasSearched] = useState(false);
    const router = useRouter();

    // Debounced Search Effect
    useEffect(() => {
        const delayDebounceFn = setTimeout(async () => {
            if (query.trim()) {
                setLoading(true);
                const { searchUsers } = await import("@/app/actions/users");
                const res = await searchUsers(query);

                if (res.success && res.data) {
                    setResults(res.data);
                } else {
                    setResults([]);
                }
                setHasSearched(true);
                setLoading(false);
            } else {
                setResults([]);
                setHasSearched(false);
            }
        }, 300); // 300ms delay

        return () => clearTimeout(delayDebounceFn);
    }, [query]);

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        // Manual trigger usually handled by effect, but keep for enter key consistency
        if (!query.trim()) return;
    };

    const selectUser = (its: string | null) => {
        if (!its) {
            alert("This user has no ITS number.");
            return;
        }
        router.push(`/admin/edit-user?ITS=${its}`);
    };

    return (
        <OrnateCard className="max-w-md mx-auto p-8 mt-12 bg-white/90">
            <h2 className="text-2xl font-bold text-primary-dark mb-2 text-center">Find User</h2>
            <p className="text-neutral-500 text-center mb-6 text-sm">Realtime Search by Name, Username or ITS</p>

            <form onSubmit={handleSearch} className="space-y-4">
                <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-neutral-400" />
                    <Input
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="Type Name, Username or ITS..."
                        className="pl-10 h-10"
                        autoFocus
                    />
                    {loading && (
                        <div className="absolute right-3 top-3">
                            <Loader2 className="h-4 w-4 animate-spin text-gold" />
                        </div>
                    )}
                </div>

                {error && (
                    <div className="p-3 bg-red-50 text-red-600 rounded-md text-sm text-center border border-red-100">
                        {error}
                    </div>
                )}
            </form>

            {/* Results List */}
            {hasSearched && (
                <div className="mt-6 space-y-2">
                    <p className="text-xs font-bold text-neutral-400 uppercase tracking-wider mb-2">
                        {results.length} Found
                    </p>
                    <div className="max-h-60 overflow-y-auto space-y-2">
                        {results.length === 0 ? (
                            <p className="text-center text-sm text-neutral-500 py-4">No users found.</p>
                        ) : (
                            results.map((u) => (
                                <button
                                    key={u.id}
                                    type="button"
                                    onClick={() => selectUser(u.its)}
                                    className="w-full text-left p-3 rounded-lg border border-neutral-100 hover:bg-neutral-50 hover:border-gold/30 transition-colors flex justify-between items-center group"
                                >
                                    <div>
                                        <p className="font-bold text-sm text-neutral-800">{u.name || u.username}</p>
                                        <p className="text-xs text-neutral-500 font-mono">
                                            {u.username} {u.its && `• ITS: ${u.its}`}
                                        </p>
                                    </div>
                                    <div className="opacity-0 group-hover:opacity-100 transition-opacity text-gold text-xs font-bold">
                                        SELECT &rarr;
                                    </div>
                                </button>
                            ))
                        )}
                    </div>
                </div>
            )}
        </OrnateCard>
    );
}
