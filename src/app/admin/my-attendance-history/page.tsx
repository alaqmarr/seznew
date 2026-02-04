import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getUserAttendance } from "@/app/actions/attendance";
import { OrnateHeading, OrnateCard } from "@/components/ui/premium-components";
import { AttendanceCalendar } from "@/app/profile/AttendanceCalendar";
import { CalendarCheck, ArrowLeft } from "lucide-react";
import Link from "next/link";

export default async function MyAttendanceHistoryPage() {
    const session = await getServerSession(authOptions);
    if (!session?.user) redirect("/login");

    const userId = (session.user as any).id;

    // Use server action to fetch data
    const attendanceResult = await getUserAttendance(userId);
    // Explicitly cast the status string to the union type expected by the component
    const attendanceHistory = (attendanceResult.success && attendanceResult.data)
        ? attendanceResult.data.map((record: any) => ({
            ...record,
            status: record.status as "PRESENT" | "ABSENT"
        }))
        : [];

    return (
        <div className="min-h-screen py-20 px-4 md:px-8 mt-12 bg-background-light flex justify-center">
            <div className="w-full max-w-5xl space-y-8">

                {/* Header Section */}
                <div className="flex flex-col md:flex-row items-center justify-between gap-6 relative">
                    <Link
                        href="/profile"
                        className="absolute left-0 top-0 md:relative p-3 rounded-full bg-white/50 hover:bg-gold/10 text-neutral-600 hover:text-primary-dark border border-transparent hover:border-gold/30 transition-all shadow-sm group"
                    >
                        <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
                    </Link>

                    <div className="w-full">
                        <OrnateHeading
                            arabic="سجل الحضور"
                            title="My Attendance"
                            subtitle="Track your presence and commitment"
                        />
                    </div>

                    {/* Spacer for centering logic on desktop */}
                    <div className="w-12 hidden md:block" />
                </div>

                {/* Main Content Card */}
                <OrnateCard className="p-6 md:p-10 min-h-[600px]">
                    <div className="flex items-center gap-3 mb-8 pb-4 border-b border-gold/10">
                        <div className="p-2 bg-gold/10 rounded-lg">
                            <CalendarCheck className="w-6 h-6 text-gold" />
                        </div>
                        <div>
                            <h3 className="text-xl font-serif font-bold text-primary-dark">Monthly Overview</h3>
                            <p className="text-xs text-neutral-500 uppercase tracking-widest">Attendance Records</p>
                        </div>
                    </div>

                    <div className="mt-6">
                        <AttendanceCalendar history={attendanceHistory} />
                    </div>
                </OrnateCard>
            </div>
        </div>
    );
}
