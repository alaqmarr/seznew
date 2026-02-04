import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getUserFees } from "@/app/actions/fees";
import { OrnateHeading, OrnateCard } from "@/components/ui/premium-components";
import { FeeList } from "@/app/fees/FeeList";

import { UnifiedPaymentDrawer } from "@/app/fees/UnifiedPaymentDrawer";
import { Wallet, History, ArrowLeft, LayoutGrid } from "lucide-react";
import Link from "next/link";

export default async function ContributionsPage() {
    const session = await getServerSession(authOptions);
    if (!session?.user) redirect("/login");

    const userId = (session.user as any).id;
    const username = (session.user as any).username;

    // Use server action to fetch data
    const feesResult = await getUserFees(userId);

    const fees = (feesResult.success && feesResult.data) ? feesResult.data : [];
    const pendingFees = fees.filter(f => f.status !== "PAID");

    return (
        <div className="min-h-screen py-12 px-4 bg-background-light mt-12">
            <div className="max-w-4xl mx-auto space-y-8">
                <div className="flex items-center gap-4">
                    <Link href="/profile" className="p-2 rounded-full hover:bg-black/5 transition-colors">
                        <ArrowLeft className="w-5 h-5 text-gray-600" />
                    </Link>
                    <OrnateHeading
                        title="Financial Contributions"
                        subtitle="Manage your fees and transactions"
                        className="mb-0"
                    />
                </div>

                <OrnateCard className="p-6 bg-gradient-to-br from-primary/5 to-transparent border-gold/10">
                    <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                        <div>
                            <h3 className="text-lg font-bold text-primary-dark">Pending Fees</h3>
                            <p className="text-sm text-neutral-500">
                                You have {pendingFees.length} pending monthly fees
                            </p>
                        </div>
                        <UnifiedPaymentDrawer
                            pendingFees={pendingFees}
                            pendingEvents={[]} // Fees only here
                            username={username}
                        />
                    </div>
                </OrnateCard>

                <div className="grid grid-cols-1 gap-8">
                    <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-sm border border-gold/10">
                        <div className="flex items-center gap-2 mb-6 pb-2 border-b border-gray-100">
                            <LayoutGrid className="w-5 h-5 text-gold" />
                            <h3 className="text-lg font-serif font-bold text-primary-dark">Monthly Fees</h3>
                        </div>
                        <FeeList fees={fees} username={username} />
                    </div>
                </div>
            </div>
        </div>
    );
}
