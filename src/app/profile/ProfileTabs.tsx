"use client";

import { useState } from "react";
import { User, Wallet, History, Shield, LayoutGrid } from "lucide-react";
import { cn } from "@/lib/utils";
import { OrnateHeading, OrnateCard } from "@/components/ui/premium-components";
import { ProfileForm } from "./ProfileForm";
import { UnifiedPaymentDrawer } from "@/app/fees/UnifiedPaymentDrawer";
import { FeeList } from "@/app/fees/FeeList";
import { EventContributionList } from "@/app/fees/EventContributionList";
import { TransactionHistory } from "@/app/fees/TransactionHistory";

interface ProfileTabsProps {
    user: any;
    userModules: any[];
    fees: any[];
    transactions: any[];
    events: any[];
    pendingFees: any[];
    pendingEvents: any[];
}

export function ProfileTabs({
    user,
    userModules,
    fees,
    transactions,
    events,
    pendingFees,
    pendingEvents
}: ProfileTabsProps) {
    const [activeTab, setActiveTab] = useState<"profile" | "contributions">("profile");

    return (
        <div className="space-y-8">
            <OrnateHeading
                title={user.name ? `Welcome, ${user.name}` : "My Profile"}
                subtitle="Manage your account and contributions"
            />

            {/* Tab Navigation */}
            <div className="flex justify-center">
                <div className="bg-white/50 backdrop-blur-sm p-1.5 rounded-2xl border border-gold/10 inline-flex shadow-lg">
                    <button
                        onClick={() => setActiveTab("profile")}
                        className={cn(
                            "flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold transition-all duration-300",
                            activeTab === "profile"
                                ? "bg-primary text-white shadow-md transform scale-105"
                                : "text-neutral-500 hover:text-primary hover:bg-white/50"
                        )}
                    >
                        <User className="w-4 h-4" />
                        My Profile
                    </button>
                    <button
                        onClick={() => setActiveTab("contributions")}
                        className={cn(
                            "flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold transition-all duration-300",
                            activeTab === "contributions"
                                ? "bg-primary text-white shadow-md transform scale-105"
                                : "text-neutral-500 hover:text-primary hover:bg-white/50"
                        )}
                    >
                        <Wallet className="w-4 h-4" />
                        Contributions
                    </button>
                </div>
            </div>

            {/* Tab Content */}
            <div className="transition-all duration-500 animate-in fade-in slide-in-from-bottom-4">
                {activeTab === "profile" ? (
                    <OrnateCard className="p-8 border border-gold/20 shadow-2xl bg-white/90 max-w-2xl mx-auto">
                        <ProfileForm
                            user={user}
                            assignedModules={userModules.map(m => m.module)}
                        />
                    </OrnateCard>
                ) : (
                    <div className="max-w-3xl mx-auto space-y-8">
                        {/* Quick Actions Card */}
                        <OrnateCard className="p-6 bg-gradient-to-br from-primary/5 to-transparent border-gold/10">
                            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                                <div>
                                    <h3 className="text-lg font-bold text-primary-dark">Pending Payments</h3>
                                    <p className="text-sm text-neutral-500">
                                        You have {pendingFees.length + pendingEvents.length} pending items
                                    </p>
                                </div>
                                <UnifiedPaymentDrawer
                                    pendingFees={pendingFees}
                                    pendingEvents={pendingEvents}
                                    username={user.username}
                                />
                            </div>
                        </OrnateCard>

                        {/* Financial Data */}
                        <div className="grid grid-cols-1 gap-8">
                            <div className="space-y-4">
                                <div className="flex items-center gap-2 pb-2 border-b border-gold/20">
                                    <LayoutGrid className="w-5 h-5 text-gold" />
                                    <h3 className="text-lg font-serif font-bold text-primary-dark">Monthly Fees</h3>
                                </div>
                                <FeeList fees={fees} username={user.username} />
                            </div>

                            <div className="space-y-4">
                                <div className="flex items-center gap-2 pb-2 border-b border-gold/20">
                                    <Shield className="w-5 h-5 text-gold" />
                                    <h3 className="text-lg font-serif font-bold text-primary-dark">Event Contributions</h3>
                                </div>
                                <EventContributionList events={events} username={user.username} />
                            </div>

                            <div className="space-y-4 pt-4">
                                <div className="flex items-center gap-2 pb-2 border-b border-gold/20">
                                    <History className="w-5 h-5 text-gold" />
                                    <h3 className="text-lg font-serif font-bold text-primary-dark">Transaction History</h3>
                                </div>
                                <TransactionHistory transactions={transactions} />
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
