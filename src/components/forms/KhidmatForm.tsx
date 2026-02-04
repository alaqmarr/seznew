"use client";

import { submitKhidmatRequest } from "@/app/actions";
import { useState } from "react";
import toast, { Toaster } from "react-hot-toast";
import { GoldenButton } from "../ui/premium-components";
import { User, Phone, Calendar, PenTool, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export function KhidmatForm() {
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (formData: FormData) => {
        setLoading(true);
        const result = await submitKhidmatRequest(formData);

        // Simulate a small delay for better UX
        await new Promise(resolve => setTimeout(resolve, 800));

        setLoading(false);

        if (result.error) {
            toast.error(result.error);
        } else {
            toast.success("Thank you for your invitation. We will get in touch shortly.");
            (document.getElementById("khidmatForm") as HTMLFormElement)?.reset();
        }
    };

    return (
        <div className="w-full">
            <Toaster position="top-center" />

            <form id="khidmatForm" action={handleSubmit} className="space-y-6">

                {/* Miqat Input */}
                <div className="space-y-2">
                    <label className="text-xs font-bold text-primary-dark uppercase tracking-wider flex items-center gap-2">
                        <PenTool className="w-4 h-4 text-gold" />
                        Miqat (Occasion)
                    </label>
                    <input
                        name="miqat"
                        required
                        placeholder="E.g., Urs Mubarak, Milad..."
                        className="w-full h-12 px-4 bg-white/60 border border-gold/30 rounded-lg focus:border-gold focus:ring-1 focus:ring-gold/50 outline-none transition-all placeholder:text-neutral-400 text-primary-dark"
                    />
                </div>

                {/* Name Input */}
                <div className="space-y-2">
                    <label className="text-xs font-bold text-primary-dark uppercase tracking-wider flex items-center gap-2">
                        <User className="w-4 h-4 text-gold" />
                        Your Name
                    </label>
                    <input
                        name="name"
                        required
                        placeholder="Full Name"
                        className="w-full h-12 px-4 bg-white/60 border border-gold/30 rounded-lg focus:border-gold focus:ring-1 focus:ring-gold/50 outline-none transition-all placeholder:text-neutral-400 text-primary-dark"
                    />
                </div>

                {/* Phone Input */}
                <div className="space-y-2">
                    <label className="text-xs font-bold text-primary-dark uppercase tracking-wider flex items-center gap-2">
                        <Phone className="w-4 h-4 text-gold" />
                        Contact Number
                    </label>
                    <input
                        name="phone"
                        required
                        type="tel"
                        maxLength={10}
                        placeholder="10-digit Mobile Number"
                        className="w-full h-12 px-4 bg-white/60 border border-gold/30 rounded-lg focus:border-gold focus:ring-1 focus:ring-gold/50 outline-none transition-all placeholder:text-neutral-400 text-primary-dark font-mono"
                    />
                </div>

                {/* Date Input */}
                <div className="space-y-2">
                    <label className="text-xs font-bold text-primary-dark uppercase tracking-wider flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-gold" />
                        Preferred Date
                    </label>
                    <input
                        name="dateOn"
                        type="date"
                        required
                        className="w-full h-12 px-4 bg-white/60 border border-gold/30 rounded-lg focus:border-gold focus:ring-1 focus:ring-gold/50 outline-none transition-all text-primary-dark"
                    />
                </div>

                <div className="pt-6">
                    <GoldenButton
                        type="submit"
                        disabled={loading}
                        className="w-full text-lg shadow-xl py-4 flex items-center justify-center gap-2 group"
                    >
                        {loading ? (
                            <>
                                <Loader2 className="w-5 h-5 animate-spin" />
                                Sending...
                            </>
                        ) : (
                            <>
                                Send Invitation
                                <span className="group-hover:translate-x-1 transition-transform">→</span>
                            </>
                        )}
                    </GoldenButton>
                    <p className="text-center text-xs text-neutral-400 mt-4 italic">
                        We will contact you to confirm the details.
                    </p>
                </div>
            </form>
        </div>
    );
}
