"use client";

import { useState } from "react";
import { FloorConfig } from "@/generated/prisma/client";
import { createFloor, updateFloor, deleteFloor, assignUserToFloor, removeUserFromFloor } from "@/app/actions/floors";
import { OrnateCard, GoldenButton, OrnateHeading } from "@/components/ui/premium-components";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Trash2, Edit, UserPlus, X, ChevronRight, ChevronDown } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import toast from "react-hot-toast";
import { Label } from "@/components/ui/label";

// Define the shape of data returned by getAllFloors
type FloorWithUsers = FloorConfig & {
    heads: { id: string; name: string | null; username: string; its: string | null }[];
    subHeads: { id: string; name: string | null; username: string; its: string | null }[];
    members: { id: string; name: string | null; username: string; its: string | null }[];
};

export function FloorManager({ initialFloors }: { initialFloors: FloorWithUsers[] }) {
    const [floors, setFloors] = useState<FloorWithUsers[]>(initialFloors);
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [newFloorName, setNewFloorName] = useState("");

    const handleCreate = async () => {
        if (!newFloorName.trim()) return;
        const res = await createFloor(newFloorName);
        if (res.success) {
            toast.success("Floor created.");
            setNewFloorName("");
            setIsCreateOpen(false);
            window.location.reload();
        } else {
            toast.error(res.error || "Failed");
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure? This will remove all assignments.")) return;
        const res = await deleteFloor(id);
        if (res.success) {
            toast.success("Floor removed.");
            window.location.reload();
        } else {
            toast.error(res.error || "Failed");
        }
    };

    return (
        <div className="space-y-8">
            <div className="flex justify-between items-center">
                <OrnateHeading title="Floor Management" subtitle="Configure Halls, Floors, and Teams" />
                <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                    <DialogTrigger asChild>
                        <GoldenButton><Plus className="w-4 h-4 mr-2" /> Add Floor</GoldenButton>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Create New Floor</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4 pt-4">
                            <div className="space-y-2">
                                <Label>Floor Name</Label>
                                <Input
                                    placeholder="e.g. Level 1 Hall A"
                                    value={newFloorName}
                                    onChange={(e) => setNewFloorName(e.target.value)}
                                />
                            </div>
                            <Button onClick={handleCreate} className="w-full bg-primary text-white">Create</Button>
                        </div>
                    </DialogContent>
                </Dialog>
            </div>

            <div className="grid gap-6">
                {floors.map((floor) => (
                    <FloorCard key={floor.id} floor={floor} onDelete={() => handleDelete(floor.id)} />
                ))}
                {floors.length === 0 && (
                    <div className="text-center py-12 text-gray-500">No floors configured.</div>
                )}
            </div>
        </div>
    );
}

function FloorCard({ floor, onDelete }: { floor: FloorWithUsers; onDelete: () => void }) {
    const [expanded, setExpanded] = useState(false);

    return (
        <OrnateCard className="p-0 overflow-hidden">
            <div className="p-4 flex items-center justify-between bg-gold/5 border-b border-gold/10">
                <div
                    className="flex items-center gap-3 cursor-pointer select-none"
                    onClick={() => setExpanded(!expanded)}
                >
                    <div className="bg-white p-2 rounded-full shadow-sm border border-gold/20">
                        {expanded ? <ChevronDown className="w-4 h-4 text-primary" /> : <ChevronRight className="w-4 h-4 text-primary" />}
                    </div>
                    <div>
                        <h3 className="font-bold text-lg text-primary-dark">{floor.name}</h3>
                        <p className="text-xs text-gray-500">
                            {floor.heads.length} Heads • {floor.subHeads.length} Subs • {floor.members.length} Members
                        </p>
                    </div>
                </div>
                <Button variant="ghost" size="icon" onClick={onDelete} className="text-red-400 hover:text-red-600 hover:bg-red-50">
                    <Trash2 className="w-4 h-4" />
                </Button>
            </div>

            {expanded && (
                <div className="p-6 bg-white space-y-6 animate-in slide-in-from-top-2">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        <UserGroup
                            title="Heads"
                            role="HEAD"
                            users={floor.heads}
                            floorId={floor.id}
                            badgeColor="bg-amber-100 text-amber-800 border-amber-200"
                        />
                        <UserGroup
                            title="Sub-Heads"
                            role="SUBHEAD"
                            users={floor.subHeads}
                            floorId={floor.id}
                            badgeColor="bg-blue-100 text-blue-800 border-blue-200"
                        />
                        <UserGroup
                            title="Members"
                            role="MEMBER"
                            users={floor.members}
                            floorId={floor.id}
                            badgeColor="bg-green-100 text-green-800 border-green-200"
                        />
                    </div>
                </div>
            )}
        </OrnateCard>
    );
}

function UserGroup({ title, role, users, floorId, badgeColor }: { title: string, role: "HEAD" | "SUBHEAD" | "MEMBER", users: any[], floorId: string, badgeColor: string }) {
    const [newUser, setNewUser] = useState("");

    const handleAdd = async () => {
        if (!newUser.trim()) return;
        const res = await assignUserToFloor(floorId, newUser.trim(), role);
        if (res.success) {
            toast.success(res.message || "Added");
            setNewUser("");
            window.location.reload();
        } else {
            toast.error(res.error || "Failed");
        }
    };

    const handleRemove = async (userId: string) => {
        const res = await removeUserFromFloor(floorId, userId, role);
        if (res.success) {
            toast.success("User removed from role.");
            window.location.reload();
        } else {
            toast.error(res.error || "Failed");
        }
    }

    return (
        <div className="space-y-3">
            <h4 className="font-bold text-sm text-gray-500 uppercase tracking-wider flex items-center justify-between">
                {title} <Badge variant="outline">{users.length}</Badge>
            </h4>

            <div className="flex gap-2">
                <Input
                    placeholder="ITS or Username"
                    className="h-8 text-sm"
                    value={newUser}
                    onChange={(e) => setNewUser(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
                />
                <Button size="sm" onClick={handleAdd} className="h-8 bg-gold hover:bg-gold-dark text-primary-dark">
                    <Plus className="w-3 h-3" />
                </Button>
            </div>

            <div className="space-y-1 max-h-60 overflow-y-auto">
                {users.map(u => (
                    <div key={u.id} className={`flex items-center justify-between p-2 rounded-md border text-sm ${badgeColor}`}>
                        <div className="truncate">
                            <span className="font-semibold block truncate">{u.name || u.username}</span>
                            <span className="text-[10px] opacity-70">{u.its || "No ITS"}</span>
                        </div>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 ml-2 hover:bg-black/10 rounded-full"
                            onClick={() => handleRemove(u.id)}
                        >
                            <X className="w-3 h-3" />
                        </Button>
                    </div>
                ))}
                {users.length === 0 && <p className="text-xs text-gray-400 italic">No users assigned.</p>}
            </div>
        </div>
    );
}
