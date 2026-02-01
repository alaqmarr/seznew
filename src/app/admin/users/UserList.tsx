"use client";

import { useState } from "react";
import { updateUserRole, deleteUser } from "@/app/actions/users";
import { Trash2, Loader2, Shield, User as UserIcon } from "lucide-react";
import { format } from "date-fns";

interface User {
    id: string;
    username: string;
    name: string | null;
    email: string | null;
    mobile: string | null;
    role: string;
    createdAt: Date;
}

const ROLES = ["USER", "STAFF", "WATCHER", "MANAGER", "ADMIN_CUSTOM", "ADMIN"] as const;

const roleColors: Record<string, string> = {
    ADMIN: "bg-red-100 text-red-700",
    ADMIN_CUSTOM: "bg-orange-100 text-orange-700",
    MANAGER: "bg-blue-100 text-blue-700",
    STAFF: "bg-green-100 text-green-700",
    WATCHER: "bg-purple-100 text-purple-700",
    USER: "bg-neutral-100 text-neutral-700",
};

export function UserList({ users, currentUserId }: { users: User[]; currentUserId: string }) {
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const [updatingId, setUpdatingId] = useState<string | null>(null);

    const handleDelete = async (id: string, username: string) => {
        if (!confirm(`Delete user @${username}? This cannot be undone.`)) return;
        setDeletingId(id);
        await deleteUser(id);
        setDeletingId(null);
    };

    const handleRoleChange = async (id: string, newRole: string) => {
        setUpdatingId(id);
        await updateUserRole(id, newRole as any);
        setUpdatingId(null);
    };

    if (users.length === 0) {
        return (
            <div className="text-center py-16 text-neutral-400">
                <UserIcon className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p className="font-serif text-lg text-neutral-600 mb-1">No users found</p>
            </div>
        );
    }

    return (
        <div className="overflow-x-auto">
            <table className="w-full">
                <thead>
                    <tr className="bg-neutral-50 border-b border-neutral-200">
                        <th className="px-6 py-3 text-left text-xs font-bold text-neutral-600 uppercase tracking-wider">User</th>
                        <th className="px-6 py-3 text-left text-xs font-bold text-neutral-600 uppercase tracking-wider">Contact</th>
                        <th className="px-6 py-3 text-left text-xs font-bold text-neutral-600 uppercase tracking-wider">Role</th>
                        <th className="px-6 py-3 text-left text-xs font-bold text-neutral-600 uppercase tracking-wider">Joined</th>
                        <th className="px-6 py-3 text-right text-xs font-bold text-neutral-600 uppercase tracking-wider">Actions</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                    {users.map((user) => (
                        <tr key={user.id} className="hover:bg-gold/5 transition-colors">
                            <td className="px-6 py-4">
                                <div className="flex flex-col">
                                    <span className="font-bold text-neutral-800">
                                        {user.name || <span className="text-neutral-400 italic">No name</span>}
                                    </span>
                                    <span className="text-sm text-neutral-500 font-mono">@{user.username}</span>
                                </div>
                            </td>
                            <td className="px-6 py-4">
                                <div className="flex flex-col text-sm">
                                    {user.email && (
                                        <a href={`mailto:${user.email}`} className="text-primary hover:text-gold truncate max-w-[180px]">
                                            {user.email}
                                        </a>
                                    )}
                                    {user.mobile && (
                                        <span className="text-neutral-500 font-mono text-xs">{user.mobile}</span>
                                    )}
                                    {!user.email && !user.mobile && (
                                        <span className="text-neutral-400 italic text-xs">No contact info</span>
                                    )}
                                </div>
                            </td>
                            <td className="px-6 py-4">
                                {user.id === currentUserId ? (
                                    <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-bold ${roleColors[user.role]}`}>
                                        {user.role.replace("_", " ")}
                                        <span className="ml-1 text-[10px] opacity-60">(you)</span>
                                    </span>
                                ) : (
                                    <div className="relative">
                                        <select
                                            value={user.role}
                                            onChange={(e) => handleRoleChange(user.id, e.target.value)}
                                            disabled={updatingId === user.id}
                                            className={`appearance-none px-2 py-1 pr-6 rounded text-xs font-bold border-0 cursor-pointer ${roleColors[user.role]} disabled:opacity-50`}
                                        >
                                            {ROLES.map((role) => (
                                                <option key={role} value={role}>
                                                    {role.replace("_", " ")}
                                                </option>
                                            ))}
                                        </select>
                                        {updatingId === user.id && (
                                            <Loader2 className="absolute right-1 top-1/2 -translate-y-1/2 w-3 h-3 animate-spin" />
                                        )}
                                    </div>
                                )}
                            </td>
                            <td className="px-6 py-4 text-sm text-neutral-500">
                                {format(new Date(user.createdAt), "MMM d, yyyy")}
                            </td>
                            <td className="px-6 py-4 text-right">
                                {user.id !== currentUserId && (
                                    <button
                                        onClick={() => handleDelete(user.id, user.username)}
                                        disabled={deletingId === user.id}
                                        className="p-2 rounded-lg hover:bg-red-50 text-neutral-400 hover:text-red-500 transition-colors disabled:opacity-50"
                                    >
                                        {deletingId === user.id ? (
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                        ) : (
                                            <Trash2 className="w-4 h-4" />
                                        )}
                                    </button>
                                )}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
