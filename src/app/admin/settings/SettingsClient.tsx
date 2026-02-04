"use client";

import { useState } from "react";
import { OrnateHeading, OrnateCard, GoldenButton } from "@/components/ui/premium-components";
import { RefreshCw, CheckCircle2, AlertTriangle } from "lucide-react"; // Import named icons
import { syncUsernameToIts } from "@/app/actions/settings";
import toast from "react-hot-toast";

export function SettingsClient() {
    const [isSyncing, setIsSyncing] = useState(false);

    const handleSync = async () => {
        if (!confirm("This will update all users' ITS field to match their Username. Continue?")) return;

        setIsSyncing(true);
        const res = await syncUsernameToIts();

        if (res.success) {
            toast.success(`Synced ${res.count} users successfully.`);
        } else {
            toast.error(res.error || "Sync failed.");
        }
        setIsSyncing(false);
    };

    return (
        <div className="space-y-8">
            <OrnateHeading title="System Settings" subtitle="Manage global configurations and data maintenance" />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <OrnateCard className="p-6 space-y-4">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-gold/10 rounded-full text-gold">
                            <RefreshCw className="w-6 h-6" />
                        </div>
                        <div>
                            <h3 className="text-xl font-bold text-primary-dark">User Data Sync</h3>
                            <p className="text-sm text-neutral-500">Maintenance Tools</p>
                        </div>
                    </div>

                    <p className="text-sm text-neutral-600">
                        Synchronize user records details. Currently supports syncing <strong>ITS</strong> fields to match <strong>Usernames</strong> for all users.
                    </p>

                    <div className="bg-yellow-50 border border-yellow-100 p-3 rounded-lg flex gap-2 items-start text-xs text-yellow-800">
                        <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
                        <p>This action will overwrite existing ITS values with usernames where they differ.</p>
                    </div>

                    <GoldenButton
                        onClick={handleSync}
                        disabled={isSyncing}
                        className="w-full flex justify-center items-center gap-2"
                    >
                        {isSyncing ? (
                            <RefreshCw className="w-4 h-4 animate-spin" />
                        ) : (
                            <CheckCircle2 className="w-4 h-4" />
                        )}
                        {isSyncing ? "Syncing..." : "Sync ITS with Username"}
                    </GoldenButton>
                </OrnateCard>
            </div>
        </div>
    );
}
