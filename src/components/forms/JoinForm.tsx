"use client";

import { submitMemberRegistration } from "@/app/actions";
import { useState } from "react";
import toast, { Toaster } from "react-hot-toast";
import { GoldenButton } from "../ui/premium-components";
import { User, Mail, Phone, Calendar, Hash, Globe, Activity, Trophy, Loader2, FileText } from "lucide-react";

export function JoinForm() {
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (formData: FormData) => {
        setLoading(true);
        const result = await submitMemberRegistration(formData);

        // Simulate delay UX
        await new Promise(resolve => setTimeout(resolve, 800));

        setLoading(false);

        if (result.error) {
            toast.error(result.error);
        } else {
            toast.success("Registration successful! We will contact you soon.");
            (document.getElementById("joinForm") as HTMLFormElement)?.reset();
        }
    };

    const labelClass = "text-xs font-bold text-primary-dark uppercase tracking-wider flex items-center gap-2 mb-2";
    const inputClass = "w-full h-12 px-4 bg-white/60 border border-gold/30 rounded-lg focus:border-gold focus:ring-1 focus:ring-gold/50 outline-none transition-all placeholder:text-neutral-400 text-primary-dark";
    const selectClass = "w-full h-12 px-4 bg-white/60 border border-gold/30 rounded-lg focus:border-gold focus:ring-1 focus:ring-gold/50 outline-none transition-all text-primary-dark appearance-none cursor-pointer";

    return (
        <div className="w-full">
            <Toaster position="top-center" />
            <form id="joinForm" action={handleSubmit} className="space-y-8">

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                    {/* Title */}
                    <div className="space-y-1">
                        <label className={labelClass}><User className="w-4 h-4 text-gold" /> Title</label>
                        <div className="relative">
                            <select name="title" required className={selectClass}>
                                <option value="Bhai">Bhai</option>
                                <option value="Shaikh">Shaikh</option>
                                <option value="Mulla">Mulla</option>
                                <option value="NKD">NKD</option>
                                <option value="MKD">MKD</option>
                            </select>
                            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gold/50">▼</div>
                        </div>
                    </div>

                    {/* Full Name */}
                    <div className="space-y-1">
                        <label className={labelClass}><FileText className="w-4 h-4 text-gold" /> Full Name (ITS)</label>
                        <input name="name" required placeholder="As per ITS" className={inputClass} />
                    </div>

                    {/* ITS Number */}
                    <div className="space-y-1">
                        <label className={labelClass}><Hash className="w-4 h-4 text-gold" /> ITS Number</label>
                        <input name="ITS" required maxLength={8} placeholder="8-Digit ID" className={inputClass} />
                    </div>

                    {/* Email */}
                    <div className="space-y-1">
                        <label className={labelClass}><Mail className="w-4 h-4 text-gold" /> Email Address</label>
                        <input name="email" type="email" required placeholder="email@example.com" className={inputClass} />
                    </div>

                    {/* DOB */}
                    <div className="space-y-1">
                        <label className={labelClass}><Calendar className="w-4 h-4 text-gold" /> Date of Birth</label>
                        <input name="dob" type="date" required className={inputClass} />
                    </div>

                    {/* WhatsApp */}
                    <div className="space-y-1">
                        <label className={labelClass}><Phone className="w-4 h-4 text-gold" /> WhatsApp Number</label>
                        <input name="phone" required maxLength={10} placeholder="10-digit number" className={inputClass} />
                    </div>

                    {/* Quran Hifz */}
                    <div className="space-y-1">
                        <label className={labelClass}><Trophy className="w-4 h-4 text-gold" /> Quran Hifz Status</label>
                        <div className="relative">
                            <select name="quranHifz" required className={selectClass}>
                                <option value="Juz-Amma">Juz Amma</option>
                                <option value="Surat-Balad">Surat Ul Balad</option>
                                <option value="Surat-asr">Surat Ul Asr</option>
                                <option value="Sana-Ula">Sana Ula</option>
                                <option value="Sana-Saniya">Sana Saniya</option>
                                <option value="Sana-Salesa">Sana Salesa</option>
                                <option value="Mukammal-Quran">Mukammal Quran</option>
                            </select>
                            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gold/50">▼</div>
                        </div>
                    </div>

                    {/* Passport */}
                    <div className="space-y-1">
                        <label className={labelClass}><Globe className="w-4 h-4 text-gold" /> Valid Passport?</label>
                        <div className="relative">
                            <select name="passport" required className={selectClass}>
                                <option value="Yes">Yes</option>
                                <option value="No">No</option>
                                <option value="In-Process">In Process</option>
                            </select>
                            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gold/50">▼</div>
                        </div>
                    </div>

                    {/* Kun Safar */}
                    <div className="space-y-1">
                        <label className={labelClass}><Activity className="w-4 h-4 text-gold" /> Kun Safar?</label>
                        <div className="relative">
                            <select name="kunSafar" required className={selectClass}>
                                <option value="Yes">Yes</option>
                                <option value="No">No</option>
                            </select>
                            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gold/50">▼</div>
                        </div>
                    </div>

                    {/* Occupation */}
                    <div className="space-y-1 md:col-span-2">
                        <label className={labelClass}><Activity className="w-4 h-4 text-gold" /> Occupation / Interests</label>
                        <input name="occupation/interests" required placeholder="E.g., Engineering, Design, Khidmat..." className={inputClass} />
                    </div>

                    {/* Sports */}
                    <div className="space-y-1 md:col-span-2">
                        <label className={labelClass}><Trophy className="w-4 h-4 text-gold" /> Sports Interest</label>
                        <input name="sports" required placeholder="Cricket, Football, VolleyBall etc." className={inputClass} />
                    </div>

                </div>

                <div className="pt-8 border-t border-gold/10">
                    <GoldenButton
                        type="submit"
                        disabled={loading}
                        className="w-full text-lg shadow-xl py-4 flex items-center justify-center gap-2 group"
                    >
                        {loading ? (
                            <>
                                <Loader2 className="w-5 h-5 animate-spin" />
                                Submitting...
                            </>
                        ) : (
                            <>
                                Submit Application
                                <span className="group-hover:translate-x-1 transition-transform">→</span>
                            </>
                        )}
                    </GoldenButton>
                    <p className="text-center text-xs text-neutral-400 mt-4 italic">
                        By submitting, you agree to being contacted for committee khidmat purposes.
                    </p>
                </div>
            </form>
        </div>
    );
}
