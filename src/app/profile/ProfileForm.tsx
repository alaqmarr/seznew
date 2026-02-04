"use client";

import { useState } from "react";
import { requestOTP, updateUserProfile } from "@/app/actions/profile";
import { User, Mail, Phone, Shield, Calendar, Save, Loader2, Check, Edit3, Key, Lock, Route } from "lucide-react";
import { format } from "date-fns";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

interface Module {
    id: string;
    name: string;
    description: string | null;
}

interface ProfileFormProps {
    user: {
        id: string;
        username: string;
        name: string | null;
        email: string | null;
        mobile: string | null;
        role: string;
        createdAt: Date;
    };
    assignedModules?: Module[];
}

export function ProfileForm({ user, assignedModules = [] }: ProfileFormProps) {
    const router = useRouter();
    const [isEditing, setIsEditing] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [otpLoading, setOtpLoading] = useState(false);

    // Form State
    const [formData, setFormData] = useState({
        name: user.name || "",
        email: user.email || "",
        mobile: user.mobile || "",
    });

    // Password & Security State
    const [password, setPassword] = useState("");
    const [showOtp, setShowOtp] = useState(false);
    const [otp, setOtp] = useState("");

    const handleRequestOtp = async () => {
        if (!formData.email) {
            toast.error("Please enter an email address to receive OTP");
            return;
        }

        setOtpLoading(true);
        const result = await requestOTP(formData.email);
        setOtpLoading(false);

        if (result.success) {
            setShowOtp(true);
            toast.success("Verification code sent to your email");
        } else {
            toast.error(result.error || "Failed to send OTP");
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        const isSensitiveUpdate = !!password || (formData.email !== (user.email || ""));

        if (isSensitiveUpdate && !otp) {
            // Need OTP
            toast.error("Verification code required for security changes");
            setIsLoading(false);
            return;
        }

        const result = await updateUserProfile({
            userId: user.id,
            name: formData.name,
            email: formData.email,
            mobile: formData.mobile,
            password: password || undefined,
            otpCode: otp || undefined,
            currentEmail: user.email || undefined
        });

        if (result.success) {
            toast.success("Profile updated successfully");
            setIsEditing(false);
            setPassword("");
            setOtp("");
            setShowOtp(false);
            router.refresh();
        } else {
            toast.error(result.error || "Failed to update profile");
        }
        setIsLoading(false);
    };

    const roleColors: Record<string, string> = {
        ADMIN: "bg-red-100 text-red-700 border-red-200",
        ADMIN_CUSTOM: "bg-orange-100 text-orange-700 border-orange-200",
        MANAGER: "bg-blue-100 text-blue-700 border-blue-200",
        STAFF: "bg-green-100 text-green-700 border-green-200",
        WATCHER: "bg-purple-100 text-purple-700 border-purple-200",
        USER: "bg-neutral-100 text-neutral-700 border-neutral-200",
    };

    return (
        <div className="space-y-8">
            {/* Header with username and role */}
            <div className="flex items-center justify-between pb-6 border-b border-neutral-100">
                <div>
                    <h2 className="text-2xl font-bold text-primary-dark">@{user.username}</h2>
                    <p className="text-sm text-neutral-500 mt-1">
                        Member since {format(new Date(user.createdAt), "MMMM yyyy")}
                    </p>
                </div>
                <span className={`px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wide border ${roleColors[user.role] || roleColors.USER}`}>
                    {(user.role || "USER").replace("_", " ")}
                </span>
            </div>

            {/* Profile Content */}
            {isEditing ? (
                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Basic Info Inputs */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="flex items-center gap-2 text-sm font-medium text-neutral-700 mb-2">
                                <User className="w-4 h-4" /> Full Name
                            </label>
                            <input
                                type="text"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                className="w-full px-4 py-3 border border-neutral-200 rounded-lg focus:ring-2 focus:ring-gold/50 outline-none"
                            />
                        </div>
                        <div>
                            <label className="flex items-center gap-2 text-sm font-medium text-neutral-700 mb-2">
                                <Phone className="w-4 h-4" /> Mobile
                            </label>
                            <input
                                type="tel"
                                value={formData.mobile}
                                onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
                                className="w-full px-4 py-3 border border-neutral-200 rounded-lg focus:ring-2 focus:ring-gold/50 outline-none"
                            />
                        </div>
                    </div>

                    {/* Check Email/Password Inputs */}
                    <div className="border border-gold/20 rounded-xl bg-gold/5 p-6 space-y-4">
                        <h3 className="font-bold text-primary-dark flex items-center gap-2">
                            <Lock className="w-4 h-4" /> Security Settings
                        </h3>

                        <div>
                            <label className="flex items-center gap-2 text-sm font-medium text-neutral-700 mb-2">
                                <Mail className="w-4 h-4" /> Email Address
                            </label>
                            <div className="space-y-2">
                                <input
                                    type="email"
                                    value={formData.email}
                                    onChange={(e) => {
                                        setFormData({ ...formData, email: e.target.value });
                                        if (e.target.value !== user.email) setShowOtp(false);
                                    }}
                                    placeholder="Enter legitimate email for OTP"
                                    className="w-full px-4 py-3 border border-neutral-200 rounded-lg focus:ring-2 focus:ring-gold/50 outline-none bg-white"
                                />
                                {formData.email !== (user.email || "") && (
                                    <p className="text-xs text-amber-600">
                                        * Changing email requires verification code.
                                    </p>
                                )}
                            </div>
                        </div>

                        <div>
                            <label className="flex items-center gap-2 text-sm font-medium text-neutral-700 mb-2">
                                <Key className="w-4 h-4" /> New Password (Optional)
                            </label>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="Leave blank to keep current"
                                className="w-full px-4 py-3 border border-neutral-200 rounded-lg focus:ring-2 focus:ring-gold/50 outline-none bg-white font-mono"
                            />
                        </div>

                        {/* OTP Logic */}
                        {(password || formData.email !== (user.email || "")) && (
                            <div className="pt-2 animate-in fade-in slide-in-from-top-2">
                                {!showOtp ? (
                                    <button
                                        type="button"
                                        onClick={handleRequestOtp}
                                        disabled={otpLoading || !formData.email}
                                        className="w-full py-3 bg-primary text-white font-bold rounded-lg hover:bg-primary-dark transition-colors disabled:opacity-50"
                                    >
                                        {otpLoading ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : "Send Verification Code"}
                                    </button>
                                ) : (
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold uppercase tracking-wider text-primary">Enter Verification Code</label>
                                        <div className="flex gap-2">
                                            <input
                                                type="text"
                                                value={otp}
                                                onChange={e => setOtp(e.target.value)}
                                                className="flex-1 px-4 py-3 border border-primary rounded-lg text-lg font-bold tracking-widest text-center"
                                                placeholder="XXXXXX"
                                                maxLength={6}
                                            />
                                            <button
                                                type="button"
                                                onClick={handleRequestOtp}
                                                disabled={otpLoading}
                                                className="px-4 bg-neutral-100 text-neutral-600 rounded-lg hover:bg-neutral-200 font-medium text-sm"
                                            >
                                                Resend
                                            </button>
                                        </div>
                                        <p className="text-xs text-neutral-500">
                                            Sent to {formData.email}
                                        </p>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Edit Mode Actions */}
                    <div className="flex items-center gap-3 pt-4">
                        <button
                            type="submit"
                            disabled={isLoading || ((!!password || formData.email !== (user.email || "")) && !otp)}
                            className="flex items-center gap-2 px-6 py-2.5 bg-primary hover:bg-primary-dark text-white font-bold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isLoading ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                                <Save className="w-4 h-4" />
                            )}
                            Save Changes
                        </button>
                        <button
                            type="button"
                            onClick={() => {
                                setIsEditing(false);
                                setShowOtp(false);
                                setOtp("");
                                setPassword("");
                                setFormData({
                                    name: user.name || "",
                                    email: user.email || "",
                                    mobile: user.mobile || "",
                                });
                            }}
                            className="px-6 py-2.5 text-neutral-600 font-medium rounded-lg hover:bg-neutral-100 transition-colors"
                        >
                            Cancel
                        </button>
                    </div>
                </form>
            ) : (
                <div className="space-y-6">
                    {/* View Mode */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="flex items-center gap-2 text-sm font-medium text-neutral-700 mb-2">
                                <User className="w-4 h-4" /> Full Name
                            </label>
                            <p className="px-4 py-3 bg-neutral-50 rounded-lg text-neutral-800 border border-transparent">
                                {user.name || <span className="text-neutral-400 italic">Not set</span>}
                            </p>
                        </div>
                        <div>
                            <label className="flex items-center gap-2 text-sm font-medium text-neutral-700 mb-2">
                                <Phone className="w-4 h-4" /> Mobile
                            </label>
                            <p className="px-4 py-3 bg-neutral-50 rounded-lg text-neutral-800 border border-transparent">
                                {user.mobile || <span className="text-neutral-400 italic">Not set</span>}
                            </p>
                        </div>
                    </div>

                    <div className="border border-gold/20 rounded-xl bg-gold/5 p-6">
                        <h3 className="font-bold text-primary-dark flex items-center gap-2 mb-4">
                            <Lock className="w-4 h-4" /> Security Settings
                        </h3>
                        <div>
                            <label className="flex items-center gap-2 text-sm font-medium text-neutral-700 mb-2">
                                <Mail className="w-4 h-4" /> Email Address
                            </label>
                            <p className="px-4 py-3 bg-white/50 border border-gold/10 rounded-lg text-neutral-800">
                                {user.email || <span className="text-neutral-400 italic">No email linked</span>}
                            </p>
                        </div>
                    </div>

                    {/* View Mode Actions */}
                    <div className="pt-4">
                        <button
                            type="button"
                            onClick={() => setIsEditing(true)}
                            className="flex items-center gap-2 px-6 py-2.5 bg-gold/10 hover:bg-gold/20 text-primary-dark font-bold rounded-lg border border-gold/30 transition-colors"
                        >
                            <Edit3 className="w-4 h-4" />
                            Edit Profile
                        </button>
                    </div>
                </div>
            )}

            {/* Assigned Modules Section */}
            {assignedModules && assignedModules.length > 0 && (
                <div className="pt-8 border-t border-neutral-100">
                    <h3 className="text-lg font-bold text-primary-dark mb-4 flex items-center gap-2">
                        <Shield className="w-5 h-5 text-gold" />
                        Assigned Modules
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {assignedModules.map((module) => (
                            <div key={module.id} className="p-3 bg-neutral-50 border border-neutral-100 rounded-lg flex items-start gap-3">
                                <div className="p-2 bg-white rounded shadow-sm text-primary">
                                    <Route className="w-4 h-4" />
                                </div>
                                <div>
                                    <span className="font-bold text-neutral-800 text-sm block">{module.name}</span>
                                    {module.description && (
                                        <span className="text-xs text-neutral-500">{module.description}</span>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
