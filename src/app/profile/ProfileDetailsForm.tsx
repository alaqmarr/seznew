"use client";

import { useState } from "react";
import { updateUserAdditionalDetails } from "@/app/actions/profile";
import { Calendar, Globe, Activity, Trophy, Save, Loader2, Edit3, UserCircle, Hash } from "lucide-react";
import toast from "react-hot-toast";
import { format, differenceInYears } from "date-fns";
import { useRouter } from "next/navigation";

export function ProfileDetailsForm({ user }: { user: any }) {
    const router = useRouter();
    const [isEditing, setIsEditing] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const [formData, setFormData] = useState({
        dob: user.dob ? format(new Date(user.dob), "yyyy-MM-dd") : "",
        quranHifz: user.quranHifz || "",
        passport: user.passport || "",
        kunSafar: user.kunSafar || "",
        occupation: user.occupation || "",
        sports: user.sports || "",
    });

    const calculateAge = (dobString: string) => {
        if (!dobString) return "";
        const age = differenceInYears(new Date(), new Date(dobString));
        return age >= 0 ? age.toString() : "";
    };

    const age = calculateAge(formData.dob);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        const result = await updateUserAdditionalDetails({
            userId: user.id,
            dob: formData.dob ? new Date(formData.dob) : null,
            quranHifz: formData.quranHifz,
            passport: formData.passport,
            kunSafar: formData.kunSafar,
            occupation: formData.occupation,
            sports: formData.sports,
        });

        setIsLoading(false);

        if (result.success) {
            toast.success("Additional details updated successfully!");
            setIsEditing(false);
            router.refresh();
        } else {
            toast.error(result.error || "Failed to update details.");
        }
    };

    // View Mode rendering
    if (!isEditing) {
        return (
            <div className="space-y-6">
                {/* Header row with Edit button always visible at the top */}
                <div className="flex items-center justify-between pb-4 border-b border-neutral-100">
                    <div>
                        <h3 className="text-base font-bold text-primary-dark">Personal & Community Details</h3>
                        <p className="text-xs text-neutral-500 mt-0.5">Your profile information visible to administrators</p>
                    </div>
                    <button
                        type="button"
                        onClick={() => setIsEditing(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-gold/10 hover:bg-gold/20 text-primary-dark font-bold rounded-lg border border-gold/30 transition-colors text-sm shrink-0"
                    >
                        <Edit3 className="w-4 h-4" />
                        Edit Details
                    </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="flex items-center gap-2 text-sm font-medium text-neutral-700 mb-2">
                            <Calendar className="w-4 h-4" /> Date of Birth
                        </label>
                        <p className="px-4 py-3 bg-neutral-50 rounded-lg text-neutral-800 border border-transparent">
                            {user.dob ? format(new Date(user.dob), "dd MMMM yyyy") : <span className="text-neutral-400 italic">Not set</span>}
                        </p>
                    </div>
                    <div>
                        <label className="flex items-center gap-2 text-sm font-medium text-neutral-700 mb-2">
                            <Activity className="w-4 h-4" /> Age
                        </label>
                        <p className="px-4 py-3 bg-neutral-50 rounded-lg text-neutral-800 border border-transparent">
                            {user.dob ? `${calculateAge(user.dob)} years` : <span className="text-neutral-400 italic">Not available</span>}
                        </p>
                    </div>
                    <div>
                        <label className="flex items-center gap-2 text-sm font-medium text-neutral-700 mb-2">
                            <UserCircle className="w-4 h-4" /> Occupation / Interests
                        </label>
                        <p className="px-4 py-3 bg-neutral-50 rounded-lg text-neutral-800 border border-transparent">
                            {user.occupation || <span className="text-neutral-400 italic">Not set</span>}
                        </p>
                    </div>
                    <div>
                        <label className="flex items-center gap-2 text-sm font-medium text-neutral-700 mb-2">
                            <Trophy className="w-4 h-4" /> Quran Hifz Status
                        </label>
                        <p className="px-4 py-3 bg-neutral-50 rounded-lg text-neutral-800 border border-transparent">
                            {user.quranHifz || <span className="text-neutral-400 italic">Not set</span>}
                        </p>
                    </div>
                    <div>
                        <label className="flex items-center gap-2 text-sm font-medium text-neutral-700 mb-2">
                            <Globe className="w-4 h-4" /> Valid Passport?
                        </label>
                        <p className="px-4 py-3 bg-neutral-50 rounded-lg text-neutral-800 border border-transparent">
                            {user.passport || <span className="text-neutral-400 italic">Not set</span>}
                        </p>
                    </div>
                    <div>
                        <label className="flex items-center gap-2 text-sm font-medium text-neutral-700 mb-2">
                            <Activity className="w-4 h-4" /> Kun Safar?
                        </label>
                        <p className="px-4 py-3 bg-neutral-50 rounded-lg text-neutral-800 border border-transparent">
                            {user.kunSafar || <span className="text-neutral-400 italic">Not set</span>}
                        </p>
                    </div>
                    <div className="md:col-span-2">
                        <label className="flex items-center gap-2 text-sm font-medium text-neutral-700 mb-2">
                            <Trophy className="w-4 h-4" /> Sports Interest
                        </label>
                        <p className="px-4 py-3 bg-neutral-50 rounded-lg text-neutral-800 border border-transparent">
                            {user.sports || <span className="text-neutral-400 italic">Not set</span>}
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    // Edit Mode rendering
    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <label className="flex items-center gap-2 text-sm font-medium text-neutral-700 mb-2">
                        <Calendar className="w-4 h-4" /> Date of Birth
                    </label>
                    <input
                        type="date"
                        value={formData.dob}
                        onChange={(e) => setFormData({ ...formData, dob: e.target.value })}
                        className="w-full px-4 py-3 border border-neutral-200 rounded-lg focus:ring-2 focus:ring-gold/50 outline-none"
                    />
                </div>
                <div>
                    <label className="flex items-center gap-2 text-sm font-medium text-neutral-700 mb-2">
                        <Activity className="w-4 h-4" /> Age <span className="text-xs text-neutral-400 font-normal">(Auto-calculated)</span>
                    </label>
                    <input
                        type="text"
                        value={age ? `${age} years` : ""}
                        disabled
                        placeholder="Select DOB first"
                        className="w-full px-4 py-3 border border-neutral-100 bg-neutral-50 rounded-lg text-neutral-500 cursor-not-allowed outline-none"
                    />
                </div>

                <div>
                    <label className="flex items-center gap-2 text-sm font-medium text-neutral-700 mb-2">
                        <UserCircle className="w-4 h-4" /> Occupation / Interests
                    </label>
                    <input
                        type="text"
                        value={formData.occupation}
                        onChange={(e) => setFormData({ ...formData, occupation: e.target.value })}
                        placeholder="E.g., Engineering, Design..."
                        className="w-full px-4 py-3 border border-neutral-200 rounded-lg focus:ring-2 focus:ring-gold/50 outline-none"
                    />
                </div>

                <div>
                    <label className="flex items-center gap-2 text-sm font-medium text-neutral-700 mb-2">
                        <Trophy className="w-4 h-4" /> Quran Hifz Status
                    </label>
                    <select
                        value={formData.quranHifz}
                        onChange={(e) => setFormData({ ...formData, quranHifz: e.target.value })}
                        className="w-full px-4 py-3 border border-neutral-200 rounded-lg focus:ring-2 focus:ring-gold/50 outline-none"
                    >
                        <option value="">Select Status</option>
                        <option value="Juz-Amma">Juz Amma</option>
                        <option value="Surat-Balad">Surat Ul Balad</option>
                        <option value="Surat-asr">Surat Ul Asr</option>
                        <option value="Sana-Ula">Sana Ula</option>
                        <option value="Sana-Saniya">Sana Saniya</option>
                        <option value="Sana-Salesa">Sana Salesa</option>
                        <option value="Mukammal-Quran">Mukammal Quran</option>
                    </select>
                </div>

                <div>
                    <label className="flex items-center gap-2 text-sm font-medium text-neutral-700 mb-2">
                        <Globe className="w-4 h-4" /> Valid Passport?
                    </label>
                    <select
                        value={formData.passport}
                        onChange={(e) => setFormData({ ...formData, passport: e.target.value })}
                        className="w-full px-4 py-3 border border-neutral-200 rounded-lg focus:ring-2 focus:ring-gold/50 outline-none"
                    >
                        <option value="">Select Option</option>
                        <option value="Yes">Yes</option>
                        <option value="No">No</option>
                        <option value="In-Process">In Process</option>
                    </select>
                </div>

                <div>
                    <label className="flex items-center gap-2 text-sm font-medium text-neutral-700 mb-2">
                        <Activity className="w-4 h-4" /> Kun Safar?
                    </label>
                    <select
                        value={formData.kunSafar}
                        onChange={(e) => setFormData({ ...formData, kunSafar: e.target.value })}
                        className="w-full px-4 py-3 border border-neutral-200 rounded-lg focus:ring-2 focus:ring-gold/50 outline-none"
                    >
                        <option value="">Select Option</option>
                        <option value="Yes">Yes</option>
                        <option value="No">No</option>
                    </select>
                </div>

                <div className="md:col-span-2">
                    <label className="flex items-center gap-2 text-sm font-medium text-neutral-700 mb-2">
                        <Trophy className="w-4 h-4" /> Sports Interest
                    </label>
                    <input
                        type="text"
                        value={formData.sports}
                        onChange={(e) => setFormData({ ...formData, sports: e.target.value })}
                        placeholder="Cricket, Football, VolleyBall etc."
                        className="w-full px-4 py-3 border border-neutral-200 rounded-lg focus:ring-2 focus:ring-gold/50 outline-none"
                    />
                </div>
            </div>

            <div className="flex items-center gap-3 pt-4">
                <button
                    type="submit"
                    disabled={isLoading}
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
                        // reset form data to current user data
                        setFormData({
                            dob: user.dob ? format(new Date(user.dob), "yyyy-MM-dd") : "",
                            quranHifz: user.quranHifz || "",
                            passport: user.passport || "",
                            kunSafar: user.kunSafar || "",
                            occupation: user.occupation || "",
                            sports: user.sports || "",
                        });
                    }}
                    className="px-6 py-2.5 text-neutral-600 font-medium rounded-lg hover:bg-neutral-100 transition-colors"
                >
                    Cancel
                </button>
            </div>
        </form>
    );
}
