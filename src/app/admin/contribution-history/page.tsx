import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";

import { OrnateHeading, OrnateCard } from "@/components/ui/premium-components";
import { EventContributionList } from "@/app/fees/EventContributionList";
import { ScrollText, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { UnifiedPaymentDrawer } from "@/app/fees/UnifiedPaymentDrawer";
import { TransactionHistory } from "@/app/fees/TransactionHistory";
import { getUserEventContributions, getUserTransactions } from "@/app/actions/fees";

export default async function ContributionHistoryPage() {
    const session = await getServerSession(authOptions);
    if (!session?.user) redirect("/login");

    const userId = (session.user as any).id;
    const userRole = (session.user as any).role;
    const username = (session.user as any).username;

    // Use server action to fetch data
    const [eventsResult, transactionsResult] = await Promise.all([
        getUserEventContributions(userId),
        getUserTransactions(userId)
    ]);

    const events = (eventsResult.success && eventsResult.data) ? eventsResult.data : [];
    // @ts-ignore - Ignoring type mismatch if any, assuming TransactionHistory handles the type
    const transactions = (transactionsResult.success && transactionsResult.data) ? transactionsResult.data : [];
    const pendingEvents = events.filter(e => e.status !== "PAID");

    return (
        <div className="min-h-screen py-12 px-4 bg-background-light mt-12">
            <div className="max-w-4xl mx-auto space-y-8">
                <div className="flex items-center gap-4">
                    <Link href="/profile" className="p-2 rounded-full hover:bg-black/5 transition-colors">
                        <ArrowLeft className="w-5 h-5 text-gray-600" />
                    </Link>
                    <OrnateHeading
                        title="Transaction History"
                        subtitle="Your complete payment record"
                        className="mb-0"
                    />
                </div>

                <OrnateCard className="p-6 bg-gradient-to-br from-primary/5 to-transparent border-gold/10">
                    <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                        <div>
                            <h3 className="text-lg font-bold text-primary-dark">Pending Contributions</h3>
                            <p className="text-sm text-neutral-500">
                                You have {pendingEvents.length} pending event contributions
                            </p>
                        </div>
                        <UnifiedPaymentDrawer
                            pendingFees={[]} // Only handling events here
                            pendingEvents={pendingEvents}
                            username={username}
                        />
                    </div>
                </OrnateCard>

                <div className="space-y-8">
                    {/* 1. All Transactions (Moved from Contributions Page) */}
                    <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-sm border border-gold/10">
                        <div className="flex items-center gap-2 mb-6 pb-2 border-b border-gray-100">
                            <ScrollText className="w-5 h-5 text-gold" />
                            <h3 className="text-lg font-serif font-bold text-primary-dark">Payment History</h3>
                        </div>
                        <TransactionHistory transactions={transactions} />
                    </div>

                    {/* 2. Detailed Event Commitments */}
                    <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-sm border border-gold/10">
                        <div className="flex items-center gap-2 mb-6 pb-2 border-b border-gray-100">
                            <ScrollText className="w-5 h-5 text-gold" />
                            <h3 className="text-lg font-serif font-bold text-primary-dark">Event Commitments</h3>
                        </div>
                        <EventContributionList events={events} username={username} />
                    </div>
                </div>
            </div>
        </div>
    );
}
