"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { GlobalErrorModal } from "@/components/ui/GlobalErrorModal";
import { Loader2, ArrowLeft, Save, Check, AlertTriangle, Lock } from "lucide-react";
import { OrnateCard } from "@/components/ui/premium-components";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { updateUserByAdmin } from "@/app/actions/users";
import { Role } from "@/generated/prisma/client";

interface EditUserProps {
    user: {
        id: string;
        username: string;
        name: string | null;
        email: string | null;
        mobile: string | null;
        its: string | null;
        role: Role;
    };
    currentUserRole: string;
}

const ROLES = ["USER", "STAFF", "WATCHER", "MANAGER", "ADMIN_CUSTOM", "ADMIN"] as const;

export function EditUserClient({ user, currentUserRole }: EditUserProps) {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        username: user.username || "",
        name: user.name || "",
        email: user.email || "",
        mobile: user.mobile || "",
        its: user.its || "",
        role: user.role,
        password: "", // Only if changing
    });

    // Delete Flow State
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [deleteStats, setDeleteStats] = useState<any>(null);
    const [loadingStats, setLoadingStats] = useState(false);
    const [deleteConfirmInput, setDeleteConfirmInput] = useState("");
    const [isDeleting, setIsDeleting] = useState(false);

    // Access Denied State
    const [showAccessDenied, setShowAccessDenied] = useState(false);

    const isAdmin = currentUserRole === "ADMIN";

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!isAdmin) {
            setShowAccessDenied(true);
            return;
        }

        setLoading(true);

        const res = await updateUserByAdmin(user.id, {
            ...formData,
            password: formData.password || undefined // Only send if not empty
        });

        if (res.success) {
            toast.success("User updated successfully");
            setFormData(prev => ({ ...prev, password: "" })); // Clear password field
        } else {
            toast.error(res.error || "Update failed");
        }
        setLoading(false);
    };

    const initiateDelete = async () => {
        if (!isAdmin) {
            setShowAccessDenied(true);
            return;
        }

        setShowDeleteModal(true);
        setLoadingStats(true);
        const { getUserStats } = await import("@/app/actions/users");
        const res = await getUserStats(user.id);
        if (res.success) {
            setDeleteStats(res.stats);
        } else {
            toast.error("Failed to fetch user stats");
        }
        setLoadingStats(false);
    };

    const confirmDelete = async () => {
        if (deleteConfirmInput !== "DELETE") return;

        setIsDeleting(true);
        const { deleteUser } = await import("@/app/actions/users");
        const res = await deleteUser(user.id);

        if (res.success) {
            toast.success("User deleted successfully");
            router.push("/admin/edit-user");
        } else {
            toast.error(res.error || "Failed to delete user");
            setIsDeleting(false);
        }
    };

    return (
        <>
            <OrnateCard className="max-w-2xl mx-auto p-6 mt-8 bg-white/95">
                <div className="flex items-center justify-between mb-6 pb-4 border-b border-gold/10">
                    <div className="flex items-center gap-4">
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => router.push("/admin/edit-user")}
                            className="rounded-full hover:bg-neutral-100"
                        >
                            <ArrowLeft className="w-5 h-5" />
                        </Button>
                        <div>
                            <h2 className="text-xl font-bold text-primary-dark">Edit User Details</h2>
                            <p className="text-sm text-neutral-500">Updating profile for @{user.username}</p>
                        </div>
                    </div>

                    <Button
                        variant="destructive"
                        size="sm"
                        onClick={initiateDelete}
                        className="bg-red-50 text-red-600 hover:bg-red-100 border-red-200 shadow-none"
                    >
                        {isAdmin ? <AlertTriangle className="w-4 h-4 mr-1" /> : <Lock className="w-4 h-4 mr-1" />}
                        Delete User
                    </Button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-neutral-600 uppercase">Username</label>
                            <Input
                                value={formData.username}
                                onChange={e => setFormData({ ...formData, username: e.target.value })}
                                placeholder="Username"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-bold text-neutral-600 uppercase">ITS Number</label>
                            <Input
                                value={formData.its}
                                onChange={e => setFormData({ ...formData, its: e.target.value })}
                                placeholder="ITS Number"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-bold text-neutral-600 uppercase">Full Name</label>
                            <Input
                                value={formData.name}
                                onChange={e => setFormData({ ...formData, name: e.target.value })}
                                placeholder="Full Name"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-bold text-neutral-600 uppercase">Email</label>
                            <Input
                                type="email"
                                value={formData.email}
                                onChange={e => setFormData({ ...formData, email: e.target.value })}
                                placeholder="Email Address"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-bold text-neutral-600 uppercase">Mobile</label>
                            <Input
                                value={formData.mobile}
                                onChange={e => setFormData({ ...formData, mobile: e.target.value })}
                                placeholder="Mobile Number"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-bold text-neutral-600 uppercase">Role</label>
                            <select
                                value={formData.role}
                                onChange={e => setFormData({ ...formData, role: e.target.value as Role })}
                                className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                            >
                                {ROLES.map(r => (
                                    <option key={r} value={r}>{r}</option>
                                ))}
                            </select>
                        </div>

                        <div className="col-span-full pt-4 border-t border-dashed border-gray-200">
                            <div className="p-4 bg-yellow-50/50 rounded-lg border border-yellow-100">
                                <label className="text-xs font-bold text-yellow-800 uppercase mb-2 block">Change Password (Optional)</label>
                                <Input
                                    type="password"
                                    value={formData.password}
                                    onChange={e => setFormData({ ...formData, password: e.target.value })}
                                    placeholder="Leave empty to keep current password"
                                    className="bg-white"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="pt-4 flex justify-end gap-3">
                        <Button type="button" variant="ghost" onClick={() => router.back()}>Cancel</Button>
                        <Button type="submit" className="bg-primary text-white hover:bg-primary-dark" disabled={loading}>
                            {loadIcon(loading, isAdmin)}
                            {isAdmin ? "Save Changes" : "Locked"}
                        </Button>
                    </div>
                </form>
            </OrnateCard>

            <GlobalErrorModal
                isOpen={showAccessDenied}
                onClose={() => setShowAccessDenied(false)}
            />

            {/* Delete Confirmation Modal */}
            {showDeleteModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 animate-in fade-in zoom-in duration-200">
                        <div className="text-center mb-6">
                            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <AlertTriangle className="w-8 h-8 text-red-600" />
                            </div>
                            <h3 className="text-xl font-bold text-neutral-900">Delete User Account?</h3>
                            <p className="text-sm text-neutral-500 mt-2">
                                You are about to permanently delete <strong>{user.name || user.username}</strong>.
                                This action cannot be undone.
                            </p>
                        </div>

                        {loadingStats ? (
                            <div className="py-8 text-center text-neutral-400">
                                <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
                                <p className="text-xs">Analyzing linked records...</p>
                            </div>
                        ) : deleteStats ? (
                            <div className="bg-neutral-50 rounded-lg p-4 mb-6 text-sm">
                                <p className="font-bold text-neutral-700 mb-2">The following data will be PERMANENTLY deleted:</p>
                                <ul className="space-y-1 text-neutral-600">
                                    <li className="flex justify-between"><span>Attendance Records:</span> <b>{deleteStats.attendance}</b></li>
                                    <li className="flex justify-between"><span>Fee Records:</span> <b>{deleteStats.fees}</b></li>
                                    <li className="flex justify-between"><span>Event Contributions:</span> <b>{deleteStats.contributions}</b></li>
                                    <li className="flex justify-between"><span>Module Access:</span> <b>{deleteStats.modules}</b></li>
                                </ul>
                            </div>
                        ) : null}

                        <div className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-red-600 uppercase">Type "DELETE" to confirm</label>
                                <Input
                                    value={deleteConfirmInput}
                                    onChange={(e) => setDeleteConfirmInput(e.target.value)}
                                    placeholder="DELETE"
                                    className="border-red-200 focus:border-red-500"
                                />
                            </div>

                            <div className="flex gap-3">
                                <Button
                                    className="flex-1"
                                    variant="outline"
                                    onClick={() => {
                                        setShowDeleteModal(false);
                                        setDeleteConfirmInput("");
                                    }}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    className="flex-1 bg-red-600 hover:bg-red-700 text-white"
                                    disabled={deleteConfirmInput !== "DELETE" || isDeleting}
                                    onClick={confirmDelete}
                                >
                                    {isDeleting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : "Confirm Delete"}
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}

function loadIcon(loading: boolean, isAdmin: boolean) {
    if (loading) return <Loader2 className="w-4 h-4 animate-spin mr-2" />;
    if (isAdmin) return <Save className="w-4 h-4 mr-2" />;
    return <Lock className="w-4 h-4 mr-2" />;
}
