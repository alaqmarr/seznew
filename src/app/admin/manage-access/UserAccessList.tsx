"use client";

import { useState } from "react";
import { UserModuleEditor } from "./UserModuleEditor";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Drawer,
    DrawerContent,
    DrawerDescription,
    DrawerHeader,
    DrawerTitle,
} from "@/components/ui/drawer";
import { Search, Shield, ShieldCheck, User as UserIcon, ChevronRight } from "lucide-react";
import { useRouter } from "next/navigation";

interface UserWithModules {
    id: string;
    username: string;
    name: string | null;
    role: string;
    moduleAccess: { moduleId: string }[];
    _count: { moduleAccess: number };
}

interface Props {
    users: UserWithModules[];
    allModules: any[];
}

export function UserAccessList({ users, allModules }: Props) {
    const router = useRouter();
    const [search, setSearch] = useState("");
    const [selectedUser, setSelectedUser] = useState<UserWithModules | null>(null);

    const filteredUsers = users.filter((u) =>
        (u.name?.toLowerCase() || "").includes(search.toLowerCase()) ||
        u.username.toLowerCase().includes(search.toLowerCase())
    );

    const getRoleBadge = (role: string) => {
        switch (role) {
            case "ADMIN_CUSTOM":
                return (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-gold/10 text-gold border border-gold/30 text-xs font-bold rounded-full uppercase">
                        <ShieldCheck className="w-3 h-3" /> Custom Admin
                    </span>
                );
            case "USER":
                return (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-50 text-blue-600 border border-blue-200 text-xs font-bold rounded-full uppercase">
                        <UserIcon className="w-3 h-3" /> User
                    </span>
                );
            default:
                return (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-neutral-100 text-neutral-600 text-xs font-bold rounded-full uppercase">
                        <Shield className="w-3 h-3" /> {role}
                    </span>
                );
        }
    };

    const handleDrawerOpenChange = (open: boolean) => {
        if (!open) {
            setSelectedUser(null);
            router.refresh(); // Refresh to update counts in table
        }
    };

    return (
        <div className="space-y-6">
            {/* Search Bar */}
            <div className="flex items-center justify-between">
                <div className="relative w-full max-w-sm">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                    <input
                        type="text"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search by name or ITS ID..."
                        className="w-full pl-10 pr-4 py-2 border border-neutral-200 rounded-lg focus:ring-2 focus:ring-gold/50 focus:border-gold outline-none"
                    />
                </div>
                <div className="text-xs text-neutral-400">
                    Showing {filteredUsers.length} users
                </div>
            </div>

            {/* Users Table */}
            <div className="border border-neutral-200 rounded-lg overflow-hidden bg-white shadow-sm">
                <Table>
                    <TableHeader>
                        <TableRow className="bg-neutral-50 hover:bg-neutral-50">
                            <TableHead className="py-3 px-6 font-bold uppercase text-xs text-neutral-500">User</TableHead>
                            <TableHead className="py-3 px-6 font-bold uppercase text-xs text-neutral-500">Role</TableHead>
                            <TableHead className="py-3 px-6 font-bold uppercase text-xs text-neutral-500 text-center">Modules</TableHead>
                            <TableHead className="py-3 px-6 font-bold uppercase text-xs text-neutral-500 text-right">Action</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredUsers.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={4} className="text-center py-12 text-neutral-400">
                                    <p>No users found matching "{search}"</p>
                                </TableCell>
                            </TableRow>
                        ) : (
                            filteredUsers.map((user) => (
                                <TableRow key={user.id} className="hover:bg-neutral-50/50 transition-colors">
                                    <TableCell className="py-3 px-6">
                                        <div>
                                            <span className="font-bold text-neutral-800 block text-sm">{user.name || user.username}</span>
                                            <span className="text-xs text-neutral-500 font-mono">@{user.username}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell className="py-3 px-6">
                                        {getRoleBadge(user.role)}
                                    </TableCell>
                                    <TableCell className="py-3 px-6 text-center">
                                        <span className={`inline-flex items-center justify-center min-w-[1.5rem] h-6 px-1.5 rounded-full text-xs font-bold ${user._count.moduleAccess > 0
                                            ? "bg-primary/10 text-primary"
                                            : "bg-neutral-100 text-neutral-400"
                                            }`}>
                                            {user._count.moduleAccess}
                                        </span>
                                    </TableCell>
                                    <TableCell className="py-3 px-6 text-right">
                                        <button
                                            onClick={() => setSelectedUser(user)}
                                            className="inline-flex items-center gap-1 px-3 py-1.5 bg-white border border-neutral-200 text-neutral-700 text-xs font-bold rounded-lg hover:bg-neutral-50 hover:border-neutral-300 transition-colors shadow-sm"
                                        >
                                            Manage <ChevronRight className="w-3 h-3" />
                                        </button>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            {/* Quick Edit Drawer */}
            <Drawer open={!!selectedUser} onOpenChange={handleDrawerOpenChange}>
                <DrawerContent className="max-h-[85vh]">
                    <div className="mx-auto w-full max-w-xl">
                        <DrawerHeader className="pb-4 border-b border-neutral-100">
                            <div className="text-center">
                                <DrawerTitle className="text-xl font-serif text-primary-dark mb-1">Manage Access</DrawerTitle>
                                <DrawerDescription>
                                    Assign modules for <span className="font-bold text-neutral-800">{selectedUser?.name || selectedUser?.username}</span>
                                </DrawerDescription>
                            </div>
                        </DrawerHeader>

                        <div className="p-6 overflow-y-auto max-h-[60vh]">
                            {selectedUser && (
                                <UserModuleEditor
                                    userId={selectedUser.id}
                                    allModules={allModules}
                                    grantedModuleIds={selectedUser.moduleAccess.map(m => m.moduleId)}
                                // No close action needed, user drags down or clicks out
                                />
                            )}
                        </div>
                    </div>
                </DrawerContent>
            </Drawer>
        </div>
    );
}
