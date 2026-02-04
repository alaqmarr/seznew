import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { OrnateHeading, OrnateCard } from "@/components/ui/premium-components";
import { ProfileForm } from "./ProfileForm";
import { getUserFees, getUserTransactions, getUserEventContributions } from "@/app/actions/fees";
import { FeeList } from "@/app/fees/FeeList";
import { TransactionHistory } from "@/app/fees/TransactionHistory";
import { UnifiedPaymentDrawer } from "@/app/fees/UnifiedPaymentDrawer";
import { EventContributionList } from "@/app/fees/EventContributionList";
import { ProfileTabs } from "./ProfileTabs";

export const dynamic = 'force-dynamic';

export default async function ProfilePage() {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
        redirect("/login");
    }

    const user = await prisma.user.findUnique({
        where: { id: (session.user as any).id },
        select: {
            id: true,
            username: true,
            name: true,
            email: true,
            mobile: true,
            role: true,
            createdAt: true,
        },
    });

    if (!user) {
        redirect("/login");
    }

    const userModules = await prisma.userModuleAccess.findMany({
        where: { userId: (session.user as any).id },
        include: { module: true }
    });

    // Fetch Fee Data
    const [feesResult, transactionsResult, eventsResult] = await Promise.all([
        getUserFees((session.user as any).id),
        getUserTransactions((session.user as any).id),
        getUserEventContributions((session.user as any).id)
    ]);

    // Ensure we handle undefined data gracefully
    const fees = (feesResult.success && feesResult.data) ? feesResult.data : [];
    // @ts-ignore - Transaction type complexity
    const transactions = (transactionsResult.success && transactionsResult.data) ? transactionsResult.data : [];
    const events = (eventsResult.success && eventsResult.data) ? eventsResult.data : [];

    // Filter pending/partial items
    const pendingFees = fees.filter(f => f.status !== "PAID");
    const pendingEvents = events.filter(e => e.status !== "PAID");

    return (
        <div className="min-h-screen py-20 px-4 bg-background-light">
            <ProfileTabs
                user={user}
                userModules={userModules}
                fees={fees}
                transactions={transactions}
                events={events}
                pendingFees={pendingFees}
                pendingEvents={pendingEvents}
            />
        </div>
    );
}
