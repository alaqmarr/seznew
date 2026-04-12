"use client";

import { OrnateHeading, OrnateCard } from "@/components/ui/premium-components";
import { ProfileForm } from "./ProfileForm";
import { ProfileDetailsForm } from "./ProfileDetailsForm";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

interface ProfileTabsProps {
    user: any;
    userModules: any[];
}

export function ProfileTabs({
    user,
    userModules,
}: ProfileTabsProps) {
    return (
        <div className="space-y-8 max-w-3xl mx-auto">
            <OrnateHeading
                title={user.name ? `Welcome, ${(user.name.charAt(0).toUpperCase() + user.name.slice(1).toLowerCase())}` : "My Profile"}
                subtitle="Manage your profile and settings"
            />

            <Tabs defaultValue="account" className="w-full">
                <TabsList className="grid w-full grid-cols-2 mb-8 bg-neutral-100/50 p-1.5 rounded-xl border border-neutral-200/50 shadow-sm">
                    <TabsTrigger value="account" className="rounded-lg data-[state=active]:bg-white data-[state=active]:text-primary-dark data-[state=active]:shadow-sm py-2.5 font-bold transition-all disabled:opacity-50 text-neutral-600">Account Settings</TabsTrigger>
                    <TabsTrigger value="additional" className="rounded-lg data-[state=active]:bg-white data-[state=active]:text-primary-dark data-[state=active]:shadow-sm py-2.5 font-bold transition-all disabled:opacity-50 text-neutral-600">Additional Details</TabsTrigger>
                </TabsList>

                <TabsContent value="account" className="mt-0 outline-none">
                    <OrnateCard className="p-8 border border-gold/20 shadow-2xl bg-white/90">
                        <ProfileForm
                            user={user}
                            assignedModules={userModules.map(m => m.module)}
                        />
                    </OrnateCard>
                </TabsContent>

                <TabsContent value="additional" className="mt-0 outline-none">
                    <OrnateCard className="p-8 border border-gold/20 shadow-2xl bg-white/90">
                        <ProfileDetailsForm user={user} />
                    </OrnateCard>
                </TabsContent>
            </Tabs>
        </div>
    );
}
