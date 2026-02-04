import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { OrnateHeading, OrnateCard } from "@/components/ui/premium-components";
import { ProfileForm } from "./ProfileForm";
import { getUserFees, getUserTransactions, getUserEventContributions } from "@/app/actions/fees";
import { getUserAttendance } from "@/app/actions/attendance";
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

    const userId = (session.user as any).id;

    const user = await prisma.user.findUnique({
        where: { id: userId },
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

    // Fetch Fee & Attendance Data (Moved to separate pages)
    // const [feesResult, transactionsResult, eventsResult, attendanceResult] = await Promise.all([
    //     getUserFees(userId),
    //     getUserTransactions(userId),
    //     getUserEventContributions(userId),
    //     getUserAttendance(userId) // New Fetch
    // ]);

    // We only need user modules now
    const userModules = await prisma.userModuleAccess.findMany({
        where: { userId },
        include: { module: true }
    });

    return (
        <div className="min-h-screen py-20 px-4 bg-background-light">
            <ProfileTabs
                user={user}
                userModules={userModules}
            />
        </div>
    );
}
