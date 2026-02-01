"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { GoldenButton, OrnateCard, OrnateHeading } from "@/components/ui/premium-components";
import { Input } from "@/components/ui/input";
import toast from "react-hot-toast";
import Link from "next/link";
import { Toaster } from 'react-hot-toast';

export default function LoginForm() {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const result = await signIn("credentials", {
                username,
                password,
                redirect: false,
            });

            if (result?.error) {
                toast.error("Invalid credentials");
            } else {
                toast.success("Logged in successfully");
                router.push("/");
                router.refresh();
            }
        } catch (error) {
            toast.error("An error occurred");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-gradient-to-br from-primary via-primary-dark to-black">
            {/* Background Pattern */}
            <div className="absolute inset-0 z-0 opacity-[0.05]"
                style={{
                    backgroundImage: `url("https://www.transparenttextures.com/patterns/arabesque.png")`,
                    backgroundSize: '300px'
                }}
            />

            <div className="absolute inset-0 bg-black/20 z-0 pointer-events-none" />

            <Toaster position="top-center" />

            <div className="w-full max-w-md relative z-10 px-4">
                <OrnateCard className="bg-black/30 backdrop-blur-xl border-gold/20 shadow-2xl p-8 md:p-10">
                    <div className="text-center mb-8">
                        <OrnateHeading
                            title="Admin Portal"
                            subtitle="Sign in to manage the application"
                            isDarkBg={true}
                        />
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="space-y-2 text-left">
                            <label className="text-xs font-bold text-gold uppercase tracking-widest pl-1">Username</label>
                            <Input
                                type="text"
                                placeholder="Enter username"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                className="bg-white/5 border-gold/20 focus-visible:ring-gold/50 h-12 text-base text-cream placeholder:text-white/20 rounded-lg"
                                required
                            />
                        </div>
                        <div className="space-y-2 text-left">
                            <label className="text-xs font-bold text-gold uppercase tracking-widest pl-1">Password</label>
                            <Input
                                type="password"
                                placeholder="Enter password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="bg-white/5 border-gold/20 focus-visible:ring-gold/50 h-12 text-base text-cream placeholder:text-white/20 rounded-lg"
                                required
                            />
                        </div>

                        <div className="pt-6">
                            <GoldenButton className="w-full justify-center text-lg h-14 shadow-xl shadow-gold/10" disabled={loading}>
                                {loading ? "Signing in..." : "Sign In"}
                            </GoldenButton>
                        </div>

                        <div className="text-center mt-6">
                            <Link href="/" className="text-sm font-medium text-cream/60 hover:text-gold transition-colors flex items-center justify-center gap-2">
                                ← Back to Home
                            </Link>
                        </div>
                    </form>
                </OrnateCard>

                <p className="text-center text-white/20 text-xs mt-8 font-mono">
                    Protected System • Shabab Ul Eidiz Zahabi
                </p>
            </div>
        </div>
    );
}
