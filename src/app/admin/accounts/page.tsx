import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { requireAccess } from "@/lib/access-control";
import {
    getAccountsOverview,
    getAllTransactions,
    getMemberFinancials,
    getAllFeeRecords,
    getAllEventContributions
} from "@/app/actions/accounts";
import AccountsDashboard from "./AccountsDashboard";
import { OrnateHeading } from "@/components/ui/premium-components";

export const dynamic = 'force-dynamic';

export default async function AccountsPage() {
    // 1. Auth & Access Check
    const session = await getServerSession(authOptions);
    if (!session?.user) redirect("/login");

    // Check module access explicitly if needed, or rely on layout/middleware
    // Here we use the access control utility
    const access = await requireAccess("/admin/accounts"); // Assuming this is the path
    if (!access.authorized) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background-light">
                <div className="text-center p-8">
                    <h1 className="text-2xl font-bold text-red-600 mb-2">Access Denied</h1>
                    <p className="text-gray-600">You do not have permission to view the Accounts module.</p>
                </div>
            </div>
        );
    }

    // 2. Fetch Data
    const [overviewRes, transactionsRes, membersRes, feesRes, eventsRes] = await Promise.all([
        getAccountsOverview(),
        getAllTransactions(),
        getMemberFinancials(),
        getAllFeeRecords(),
        getAllEventContributions()
    ]);

    const overview = overviewRes.success ? overviewRes.data : null;
    const transactions = (transactionsRes.success && transactionsRes.data) ? transactionsRes.data : [];
    const members = (membersRes.success && membersRes.data) ? membersRes.data : [];
    const feeRecords = (feesRes.success && feesRes.data) ? feesRes.data : [];
    const eventContributions = (eventsRes.success && eventsRes.data) ? eventsRes.data : [];

    if (!overview) {
        return <div>Error loading data.</div>;
    }

    return (
        <div className="min-h-screen py-12 px-4 sm:px-8 bg-background-light">
            <div className="max-w-7xl mx-auto space-y-8">
                <OrnateHeading
                    title="Accounts Dashboard"
                    arabic="لوحة الحسابات"
                />

                <AccountsDashboard
                    overview={overview}
                    transactions={transactions}
                    members={members}
                    feeRecords={feeRecords}
                    eventContributions={eventContributions}
                />
            </div>
        </div>
    );
}
