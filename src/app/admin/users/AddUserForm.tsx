"use client";

import { useState } from "react";
import { createUser } from "@/app/actions/users";
import { User, Lock, Mail, Phone, Shield, Loader2, Check, Plus } from "lucide-react";

const ROLES = ["USER", "STAFF", "WATCHER", "MANAGER", "ADMIN_CUSTOM", "ADMIN"] as const;

export function AddUserForm() {
    const [isLoading, setIsLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [formData, setFormData] = useState({
        username: "",
        password: "",
        name: "",
        email: "",
        mobile: "",
        role: "USER" as typeof ROLES[number],
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.username || !formData.password) {
            setError("Username and password are required");
            return;
        }

        setIsLoading(true);
        setError(null);

        const result = await createUser(formData);

        if (result.success) {
            setSuccess(true);
            setFormData({
                username: "",
                password: "",
                name: "",
                email: "",
                mobile: "",
                role: "USER",
            });
            setTimeout(() => setSuccess(false), 2000);
        } else {
            setError(result.error || "Failed to create user");
        }
        setIsLoading(false);
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
                {/* Username */}
                <div>
                    <label className="flex items-center gap-1 text-sm font-medium text-neutral-700 mb-1">
                        <User className="w-3.5 h-3.5" />
                        Username *
                    </label>
                    <input
                        type="text"
                        value={formData.username}
                        onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                        placeholder="username"
                        className="w-full px-3 py-2 border border-neutral-200 rounded-lg focus:ring-2 focus:ring-gold/50 focus:border-gold outline-none text-sm"
                    />
                </div>

                {/* Password */}
                <div>
                    <label className="flex items-center gap-1 text-sm font-medium text-neutral-700 mb-1">
                        <Lock className="w-3.5 h-3.5" />
                        Password *
                    </label>
                    <input
                        type="password"
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        placeholder="••••••••"
                        className="w-full px-3 py-2 border border-neutral-200 rounded-lg focus:ring-2 focus:ring-gold/50 focus:border-gold outline-none text-sm"
                    />
                </div>
            </div>

            {/* Name */}
            <div>
                <label className="flex items-center gap-1 text-sm font-medium text-neutral-700 mb-1">
                    Full Name
                </label>
                <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="John Doe"
                    className="w-full px-3 py-2 border border-neutral-200 rounded-lg focus:ring-2 focus:ring-gold/50 focus:border-gold outline-none text-sm"
                />
            </div>

            <div className="grid grid-cols-2 gap-4">
                {/* Email */}
                <div>
                    <label className="flex items-center gap-1 text-sm font-medium text-neutral-700 mb-1">
                        <Mail className="w-3.5 h-3.5" />
                        Email
                    </label>
                    <input
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        placeholder="email@example.com"
                        className="w-full px-3 py-2 border border-neutral-200 rounded-lg focus:ring-2 focus:ring-gold/50 focus:border-gold outline-none text-sm"
                    />
                </div>

                {/* Mobile */}
                <div>
                    <label className="flex items-center gap-1 text-sm font-medium text-neutral-700 mb-1">
                        <Phone className="w-3.5 h-3.5" />
                        Mobile
                    </label>
                    <input
                        type="tel"
                        value={formData.mobile}
                        onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
                        placeholder="+91 9876543210"
                        className="w-full px-3 py-2 border border-neutral-200 rounded-lg focus:ring-2 focus:ring-gold/50 focus:border-gold outline-none text-sm"
                    />
                </div>
            </div>

            {/* Role */}
            <div>
                <label className="flex items-center gap-1 text-sm font-medium text-neutral-700 mb-1">
                    <Shield className="w-3.5 h-3.5" />
                    Role
                </label>
                <select
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value as typeof ROLES[number] })}
                    className="w-full px-3 py-2 border border-neutral-200 rounded-lg focus:ring-2 focus:ring-gold/50 focus:border-gold outline-none text-sm bg-white"
                >
                    {ROLES.map((role) => (
                        <option key={role} value={role}>
                            {role.replace("_", " ")}
                        </option>
                    ))}
                </select>
            </div>

            {/* Error */}
            {error && (
                <div className="p-2 bg-red-50 border border-red-200 text-red-600 rounded-lg text-xs">
                    {error}
                </div>
            )}

            {/* Submit */}
            <button
                type="submit"
                disabled={isLoading}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-primary hover:bg-primary-dark text-white font-bold rounded-lg transition-colors disabled:opacity-50"
            >
                {isLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                ) : success ? (
                    <Check className="w-4 h-4" />
                ) : (
                    <Plus className="w-4 h-4" />
                )}
                {success ? "User Created!" : "Add User"}
            </button>
        </form>
    );
}
