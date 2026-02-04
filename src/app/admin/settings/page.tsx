import { redirect } from "next/navigation";
import { requireAccess } from "@/lib/access-control";
import { SettingsClient } from "./SettingsClient";

export default async function SettingsPage() {
    // Assuming ADMIN role or specific access. Using generic admin check or 'settings' module
    // Verify if '/admin/settings' exists in DB or use generic ADMIN check.
    // For now, let's use the path string which matches standard logic.
    const { authorized } = await requireAccess("/admin/settings");
    if (!authorized) redirect("/");

    return (
        <div className="min-h-screen bg-background-light py-12 px-6 mt-12">
            <div className="max-w-4xl mx-auto">
                <SettingsClient />
            </div>
        </div>
    );
}
