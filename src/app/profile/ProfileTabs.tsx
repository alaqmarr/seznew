"use client";

import { OrnateHeading, OrnateCard } from "@/components/ui/premium-components";
import { ProfileForm } from "./ProfileForm";

interface ProfileTabsProps {
    user: any;
    userModules: any[];
}

export function ProfileTabs({
    user,
    userModules,
}: ProfileTabsProps) {
    return (
        <div className="space-y-8 max-w-2xl mx-auto">
            <OrnateHeading
                title={user.name ? `Welcome, ${(user.name.charAt(0).toUpperCase() + user.name.slice(1).toLowerCase())}` : "My Profile"}
                subtitle="Manage your account settings"
            />

            <OrnateCard className="p-8 border border-gold/20 shadow-2xl bg-white/90">
                <ProfileForm
                    user={user}
                    assignedModules={userModules.map(m => m.module)}
                />
            </OrnateCard>
        </div>
    );
}
