import { redirect } from "next/navigation";
import { requireAccess } from "@/lib/access-control";
import { OrnateHeading, OrnateCard } from "@/components/ui/premium-components";
import { MessageSquare } from "lucide-react";

export default async function MessagesPage() {
    const { authorized } = await requireAccess("/admin/messages");
    if (!authorized) redirect("/unauthorized");

    return (
        <div className="min-h-screen bg-background-light py-12 px-6 mt-12">
            <div className="max-w-4xl mx-auto space-y-8">
                <OrnateHeading
                    title="Messages"
                    subtitle="Communication Center"
                />

                <OrnateCard className="p-12 text-center">
                    <div className="flex justify-center mb-6">
                        <div className="bg-primary/10 p-6 rounded-full">
                            <MessageSquare className="w-12 h-12 text-primary" />
                        </div>
                    </div>
                    <h3 className="text-2xl font-serif font-bold text-gray-800 mb-4">Coming Soon</h3>
                    <p className="text-gray-500 max-w-md mx-auto">
                        This module is currently under development. Soon you will be able to send and receive messages here.
                    </p>
                </OrnateCard>
            </div>
        </div>
    );
}
