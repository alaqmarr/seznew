import { getMonthFeeStatus, getAllEventContributions, getAllTransactions } from "@/app/actions/fees";
import { requireAccess } from "@/lib/access-control";
import { redirect } from "next/navigation";
import { FeesTable } from "./FeesTable";
import { FeeControls } from "./FeeControls";
import { EventsTab } from "./EventsTab";
import { TransactionsTab } from "./TransactionsTab";
import { OrnateHeading, OrnateCard } from "@/components/ui/premium-components";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default async function AdminFeesPage({
    searchParams,
}: {
    searchParams: Promise<{ month?: string; year?: string }>;
}) {
    const { authorized } = await requireAccess("/admin/fees");
    if (!authorized) redirect("/");

    const resolvedParams = await searchParams;
    const currentDate = new Date();
    const month = resolvedParams.month ? parseInt(resolvedParams.month) : currentDate.getMonth();
    const year = resolvedParams.year ? parseInt(resolvedParams.year) : currentDate.getFullYear();

    // Fetch all data in parallel
    const [monthStatus, eventsResult, transactionsResult] = await Promise.all([
        getMonthFeeStatus(month, year),
        getAllEventContributions(),
        getAllTransactions()
    ]);

    const monthData = monthStatus.success && monthStatus.data ? monthStatus.data : [];
    const eventsData = eventsResult.success && eventsResult.data ? eventsResult.data : [];
    const txData = transactionsResult.success && transactionsResult.data ? transactionsResult.data : [];

    // Calculate stats (Monthly)
    const totalDue = monthData.reduce((sum, item) => sum + (item.record ? item.record.amount : 0), 0);
    const totalCollected = monthData.reduce((sum, item) => sum + (item.record ? item.record.paidAmount : 0), 0);
    const pendingCount = monthData.filter(item => item.record && item.record.status !== "PAID").length;

    return (
        <div className="min-h-screen bg-background-light py-12 px-6 mt-12">
            <div className="max-w-7xl mx-auto space-y-8">
                <OrnateHeading
                    title="Fee Management"
                    subtitle="Manage monthly dues, event funds, and transactions"
                    arabic="إدارة الرسوم"
                />

                <Tabs defaultValue="monthly" className="w-full">
                    <TabsList className="grid w-full grid-cols-3 max-w-md mx-auto mb-8">
                        <TabsTrigger value="monthly">Monthly Dues</TabsTrigger>
                        <TabsTrigger value="events">Event Funds</TabsTrigger>
                        <TabsTrigger value="transactions">Transactions</TabsTrigger>
                    </TabsList>

                    <TabsContent value="monthly" className="space-y-6">
                        {/* Stats Cards */}
// Update formatting in the main component
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <StatCard label="Total Due" value={`₹${totalDue.toLocaleString('en-IN')}`} />
                            <StatCard label="Collected (Month)" value={`₹${totalCollected.toLocaleString('en-IN')}`} />
                            <StatCard label="Pending Members" value={pendingCount.toString()} />
                        </div>

                        <FeeControls month={month} year={year} />

                        <OrnateCard className="p-0 overflow-hidden border border-gold/20 shadow-2xl bg-white/90 backdrop-blur-xl">
                            <FeesTable data={monthData} month={month} year={year} />
                        </OrnateCard>
                    </TabsContent>

                    <TabsContent value="events">
                        {/* @ts-ignore - Prisma Date vs JS Date type mismatch sometimes happens, safe to ignore for list display */}
                        <EventsTab events={eventsData} />
                    </TabsContent>

                    <TabsContent value="transactions">
                        {/* @ts-ignore - Transaction type complexity */}
                        <TransactionsTab transactions={txData} />
                    </TabsContent>
                </Tabs>
            </div>
        </div>
    );
}

function StatCard({ label, value }: { label: string; value: string }) {
    return (
        <OrnateCard className="p-6 text-center border border-gold/20 bg-gradient-to-br from-white to-amber-50/30 backdrop-blur-sm shadow-lg hover:shadow-xl transition-all duration-300">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">{label}</h3>
            <p className="text-4xl font-serif text-primary-dark font-bold tracking-tight">{value}</p>
        </OrnateCard>
    );
}
