"use client";

import { useState, useRef, useEffect } from "react";
import { FloorConfig } from "@/generated/prisma/client";
import { createFloor, updateFloor, deleteFloor, assignUserToFloor, removeUserFromFloor } from "@/app/actions/floors";
import { searchUsers } from "@/app/actions/modules";
import { OrnateCard, GoldenButton, OrnateHeading } from "@/components/ui/premium-components";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Trash2, Edit, UserPlus, X, ChevronRight, ChevronDown, Search, Loader2, Layers, Users, Shield, ShieldCheck } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import toast from "react-hot-toast";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

// Define the shape of data returned by getAllFloors
type FloorWithUsers = FloorConfig & {
    heads: { id: string; name: string | null; username: string; its: string | null }[];
    subHeads: { id: string; name: string | null; username: string; its: string | null }[];
    members: { id: string; name: string | null; username: string; its: string | null }[];
};

interface FloorManagerProps {
    initialFloors: FloorWithUsers[];
    userRole: string; // ADMIN, HEAD, SUBHEAD
    assignedFloorId?: string;
}

export function FloorManager({ initialFloors, userRole, assignedFloorId }: FloorManagerProps) {
    const [floors, setFloors] = useState<FloorWithUsers[]>(initialFloors);
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [newFloorName, setNewFloorName] = useState("");

    const handleCreate = async () => {
        if (!newFloorName.trim()) return;
        const res = await createFloor(newFloorName);
        if (res.success && res.data) {
            toast.success("Floor created successfully", { icon: "✨" });
            // For a proper optimistic update we'd need the full structure, but create returns basic.
            // A reload ensures we're synced, but we can try to append a basic structure if we want strict no-reload.
            // Given the complexity of relations, a reload for *creating a new floor* is acceptable, 
            // but we can make it feel smoother.
            setNewFloorName("");
            setIsCreateOpen(false);
            window.location.reload();
        } else {
            toast.error(res.error || "Failed to create floor");
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure? This will remove all assignments for this floor.")) return;
        setFloors(prev => prev.filter(f => f.id !== id)); // Optimistic remove
        const res = await deleteFloor(id);
        if (res.success) {
            toast.success("Floor removed", { icon: "🗑️" });
        } else {
            toast.error(res.error || "Failed to delete");
            // Ideally revert here, but delete is usually final
        }
    };

    return (
        <div className="space-y-8 pb-12">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4 px-2">
                <OrnateHeading
                    title="Floor Management"
                    subtitle="Configure Halls, Floors, and Teams"
                    className="md:text-left"
                />

                {userRole === "ADMIN" && (
                    <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                        <DialogTrigger asChild>
                            <GoldenButton className="flex items-center gap-2">
                                <Plus className="w-4 h-4" />
                                <span>Add Floor</span>
                            </GoldenButton>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-md bg-white/95 backdrop-blur-md border-gold/20">
                            <DialogHeader>
                                <DialogTitle className="font-serif text-2xl text-primary-dark">Create New Floor</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-6 pt-4">
                                <div className="space-y-2">
                                    <Label className="text-gray-600 font-medium">Floor / Hall Name</Label>
                                    <Input
                                        placeholder="e.g. Level 1 Hall A"
                                        value={newFloorName}
                                        onChange={(e) => setNewFloorName(e.target.value)}
                                        className="border-gray-200 focus:border-gold focus:ring-gold/20"
                                    />
                                </div>
                                <GoldenButton onClick={handleCreate} className="w-full justify-center">
                                    Create Floor
                                </GoldenButton>
                            </div>
                        </DialogContent>
                    </Dialog>
                )}
            </div>

            <div className="grid gap-6">
                {floors.map((floor) => {
                    // Logic for permissions:
                    // Admin: Everything
                    // Head: Can edit users if it's their floor. Can NOT delete floor.
                    // Subhead: Read only.

                    const isMyFloor = floor.id === assignedFloorId;
                    const canEditUsers = userRole === "ADMIN" || (userRole === "HEAD" && isMyFloor);
                    const canDeleteFloor = userRole === "ADMIN";

                    return (
                        <FloorCard
                            key={floor.id}
                            floor={floor}
                            onDelete={() => handleDelete(floor.id)}
                            canEditUsers={canEditUsers}
                            canDeleteFloor={canDeleteFloor}
                        />
                    );
                })}

                {floors.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-16 text-center space-y-4 opacity-70 bg-white/40 rounded-3xl border-2 border-dashed border-gray-200">
                        <div className="p-4 bg-gray-50 rounded-full">
                            <Layers className="w-10 h-10 text-gray-300" />
                        </div>
                        <p className="text-gray-500 font-medium">No floors configured yet.</p>
                        {userRole === "ADMIN" && (
                            <Button
                                variant="link"
                                className="text-gold hover:text-gold-dark"
                                onClick={() => setIsCreateOpen(true)}
                            >
                                Create your first floor
                            </Button>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}

function FloorCard({ floor, onDelete, canEditUsers, canDeleteFloor }: {
    floor: FloorWithUsers;
    onDelete: () => void;
    canEditUsers: boolean;
    canDeleteFloor: boolean;
}) {
    const [expanded, setExpanded] = useState(false);
    const [localFloor, setLocalFloor] = useState(floor);

    // Sync local state if prop updates
    useEffect(() => { setLocalFloor(floor) }, [floor]);

    const handleUserChange = (role: "HEAD" | "SUBHEAD" | "MEMBER", action: "ADD" | "REMOVE", user: any) => {
        setLocalFloor(prev => {
            const listKey = role === "HEAD" ? "heads" : role === "SUBHEAD" ? "subHeads" : "members";
            const currentList = prev[listKey];

            let newList;
            if (action === "ADD") {
                // Prevent duplicates
                if (currentList.some(u => u.id === user.id)) return prev;
                newList = [...currentList, user];
            } else {
                newList = currentList.filter(u => u.id !== user.id);
            }

            return { ...prev, [listKey]: newList };
        });
    };

    return (
        <OrnateCard className="p-0 overflow-hidden bg-white/90 backdrop-blur-md transition-all duration-300 hover:shadow-lg border-gold/10">
            <div
                className={cn(
                    "p-5 flex items-center justify-between cursor-pointer transition-colors duration-300 select-none",
                    expanded ? "bg-gold/5" : "bg-white hover:bg-gray-50/50"
                )}
                onClick={() => setExpanded(!expanded)}
            >
                <div className="flex items-center gap-5 w-full">
                    <div
                        className={cn(
                            "p-2.5 rounded-full shadow-sm border transition-all duration-300",
                            expanded ? "bg-gold text-white border-gold rotate-90" : "bg-white text-gray-400 border-gray-100 group-hover:border-gold/30"
                        )}
                    >
                        <ChevronRight className="w-5 h-5" />
                    </div>

                    <div className="flex-1">
                        <div className="flex items-center gap-3">
                            <h3 className="font-serif font-bold text-xl text-gray-900">{localFloor.name}</h3>
                            <Badge variant="outline" className="text-xs font-normal text-gray-400 border-gray-200">
                                ID: {localFloor.id.substring(0, 4)}...
                            </Badge>
                        </div>

                        <div className="flex flex-wrap items-center gap-4 mt-1.5">
                            <div className="flex items-center gap-1.5 text-xs font-medium text-gray-500">
                                <ShieldCheck className="w-3.5 h-3.5 text-amber-500" />
                                <span>{localFloor.heads.length} Heads</span>
                            </div>
                            <div className="w-1 h-1 rounded-full bg-gray-300" />
                            <div className="flex items-center gap-1.5 text-xs font-medium text-gray-500">
                                <Shield className="w-3.5 h-3.5 text-blue-500" />
                                <span>{localFloor.subHeads.length} Subs</span>
                            </div>
                            <div className="w-1 h-1 rounded-full bg-gray-300" />
                            <div className="flex items-center gap-1.5 text-xs font-medium text-gray-500">
                                <Users className="w-3.5 h-3.5 text-emerald-500" />
                                <span>{localFloor.members.length} Members</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div onClick={(e) => e.stopPropagation()}>
                    {canDeleteFloor && (
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={onDelete}
                            className="text-gray-300 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors h-10 w-10"
                        >
                            <Trash2 className="w-5 h-5" />
                        </Button>
                    )}
                </div>
            </div>

            {expanded && (
                <div className="p-6 bg-gray-50/30 border-t border-gray-100 animate-in slide-in-from-top-1 duration-200">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        <UserGroup
                            title="Heads"
                            role="HEAD"
                            users={localFloor.heads}
                            floorId={localFloor.id}
                            icon={ShieldCheck}
                            colorTheme="amber"
                            badgeColor="bg-amber-100 text-amber-800 border-amber-200"
                            onUpdate={handleUserChange}
                            canEdit={canEditUsers}
                        />
                        <UserGroup
                            title="Sub-Heads"
                            role="SUBHEAD"
                            users={localFloor.subHeads}
                            floorId={localFloor.id}
                            icon={Shield}
                            colorTheme="blue"
                            badgeColor="bg-blue-100 text-blue-800 border-blue-200"
                            onUpdate={handleUserChange}
                            canEdit={canEditUsers}
                        />
                        <UserGroup
                            title="Members"
                            role="MEMBER"
                            users={localFloor.members}
                            floorId={localFloor.id}
                            icon={Users}
                            colorTheme="emerald"
                            badgeColor="bg-emerald-100 text-emerald-800 border-emerald-200"
                            onUpdate={handleUserChange}
                            canEdit={canEditUsers}
                        />
                    </div>
                </div>
            )}
        </OrnateCard>
    );
}

function UserGroup({
    title,
    role,
    users,
    floorId,
    icon: Icon,
    colorTheme,
    badgeColor,
    onUpdate,
    canEdit
}: {
    title: string,
    role: "HEAD" | "SUBHEAD" | "MEMBER",
    users: any[],
    floorId: string,
    icon: any,
    colorTheme: "amber" | "blue" | "emerald",
    badgeColor: string,
    onUpdate: (role: "HEAD" | "SUBHEAD" | "MEMBER", action: "ADD" | "REMOVE", user: any) => void,
    canEdit: boolean
}) {

    const themeClasses = {
        amber: "bg-amber-50/50 border-amber-100/50 hover:border-amber-200/80",
        blue: "bg-blue-50/50 border-blue-100/50 hover:border-blue-200/80",
        emerald: "bg-emerald-50/50 border-emerald-100/50 hover:border-emerald-200/80"
    };

    const handleAdd = async (user: any) => {
        // Optimistic Add
        onUpdate(role, "ADD", user);

        const res = await assignUserToFloor(floorId, user.its || user.username, role);
        if (!res.success) {
            toast.error(res.error || "Failed to add user");
            onUpdate(role, "REMOVE", user); // Revert
        } else {
            toast.success(`added to ${title}`, { duration: 2000, icon: '✅', style: { fontSize: '12px' } });
        }
    };

    const handleRemove = async (userId: string) => {
        // Optimistic Remove
        const userToRemove = users.find(u => u.id === userId);
        if (!userToRemove) return;

        onUpdate(role, "REMOVE", userToRemove);

        const res = await removeUserFromFloor(floorId, userId, role);
        if (!res.success) {
            toast.error(res.error || "Failed to remove");
            onUpdate(role, "ADD", userToRemove); // Revert
        } else {
            toast.success("removed", { duration: 2000, icon: '🗑️', style: { fontSize: '12px' } });
        }
    }

    return (
        <div className={cn(
            "rounded-2xl border transition-all duration-300 flex flex-col h-full",
            themeClasses[colorTheme]
        )}>
            <div className="p-4 border-b border-gray-100/50 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Icon className={cn("w-4 h-4",
                        colorTheme === "amber" ? "text-amber-600" :
                            colorTheme === "blue" ? "text-blue-600" : "text-emerald-600"
                    )} />
                    <h4 className="font-bold text-sm text-gray-700 uppercase tracking-wider">{title}</h4>
                </div>
                <Badge variant="secondary" className="bg-white/80 backdrop-blur-sm text-gray-500 border border-gray-100 shadow-sm min-w-[2rem] justify-center">
                    {users.length}
                </Badge>
            </div>

            <div className="p-4 space-y-4 flex-1 flex flex-col">
                {canEdit && (
                    <UserSearch onSelect={handleAdd} placeholder={`Add ${title}...`} />
                )}

                <div className="space-y-2 flex-1 max-h-[250px] overflow-y-auto pr-1 custom-scrollbar">
                    {users.map(u => (
                        <div key={u.id} className="flex items-center justify-between p-2.5 rounded-xl bg-white border border-gray-100 shadow-sm hover:shadow-md transition-all group">
                            <div className="flex items-center gap-3 overflow-hidden">
                                <div className={cn(
                                    "w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold text-white shadow-sm flex-shrink-0",
                                    colorTheme === "amber" ? "bg-gradient-to-br from-amber-400 to-amber-600" :
                                        colorTheme === "blue" ? "bg-gradient-to-br from-blue-400 to-blue-600" :
                                            "bg-gradient-to-br from-emerald-400 to-emerald-600"
                                )}>
                                    {u.name ? u.name.substring(0, 2).toUpperCase() : "U"}
                                </div>
                                <div className="min-w-0">
                                    <span className="font-bold text-xs text-gray-800 block truncate">{u.name || u.username}</span>
                                    <span className="text-[10px] text-gray-400 font-mono tracking-wide">{u.its || "No ITS"}</span>
                                </div>
                            </div>
                            {canEdit && (
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-all hover:bg-red-50 text-gray-300 hover:text-red-500 rounded-lg flex-shrink-0"
                                    onClick={() => handleRemove(u.id)}
                                >
                                    <X className="w-3.5 h-3.5" />
                                </Button>
                            )}
                        </div>
                    ))}
                    {users.length === 0 && (
                        <div className="text-center py-8">
                            <p className="text-xs text-gray-400 italic">No {title.toLowerCase()} assigned yet.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

function UserSearch({ onSelect, placeholder }: { onSelect: (user: any) => void, placeholder?: string }) {
    const [search, setSearch] = useState("");
    const [results, setResults] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [showResults, setShowResults] = useState(false);
    const wrapperRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
                setShowResults(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    useEffect(() => {
        if (search.length > 2) {
            const timer = setTimeout(async () => {
                setLoading(true);
                const res = await searchUsers(search);
                if (res.success && res.data) {
                    setResults(res.data);
                    setShowResults(true);
                }
                setLoading(false);
            }, 300);
            return () => clearTimeout(timer);
        } else {
            setResults([]);
            setShowResults(false);
        }
    }, [search]);

    const handleSelect = (user: any) => {
        onSelect(user);
        setSearch("");
        setResults([]);
        setShowResults(false);
    }

    return (
        <div className="relative z-20" ref={wrapperRef}>
            <div className="relative">
                <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-gray-400" />
                <Input
                    placeholder={placeholder || "Search Users..."}
                    className="pl-9 h-9 text-xs bg-white border-gray-200 focus:border-gold focus:ring-1 focus:ring-gold/30 rounded-lg shadow-sm transition-all"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    onFocus={() => { if (results.length > 0) setShowResults(true) }}
                />
                {loading && <div className="absolute right-3 top-2.5"><Loader2 className="w-3.5 h-3.5 animate-spin text-gold" /></div>}
            </div>

            {showResults && results.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-100 rounded-xl shadow-[0_10px_40px_-10px_rgba(0,0,0,0.1)] max-h-56 overflow-y-auto z-50 p-1.5 animate-in slide-in-from-top-2 duration-200">
                    {results.map(user => (
                        <button
                            key={user.id}
                            className="w-full text-left p-2 rounded-lg hover:bg-gold/5 transition-colors flex items-center justify-between group border border-transparent hover:border-gold/10"
                            onClick={() => handleSelect(user)}
                        >
                            <div className="min-w-0 pr-2">
                                <p className="text-xs font-bold text-gray-800 truncate">{user.name || user.username}</p>
                                <p className="text-[10px] text-gray-400">{user.its}</p>
                            </div>
                            <div className="w-6 h-6 rounded-full bg-gold/10 flex items-center justify-center text-gold group-hover:bg-gold group-hover:text-white transition-all">
                                <Plus className="w-3 h-3" />
                            </div>
                        </button>
                    ))}
                </div>
            )}
        </div>
    )
}
