import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getUserAttendance } from "@/app/actions/attendance";
import { OrnateHeading } from "@/components/ui/premium-components";
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
        <div className="min-h-screen py-12 px-4 bg-background-light mt-12">
            <div className="max-w-4xl mx-auto space-y-8">
                <div className="flex items-center gap-4">
                    <Link href="/profile" className="p-2 rounded-full hover:bg-black/5 transition-colors">
                        <ArrowLeft className="w-5 h-5 text-gray-600" />
                    </Link>
                    <OrnateHeading
                        title="My Attendance"
                        subtitle="Your presence capability"
                        className="mb-0"
                    />
                </div>

                <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-sm border border-gold/10">
                    <div className="flex items-center gap-2 mb-6 pb-2 border-b border-gray-100">
                        <CalendarCheck className="w-5 h-5 text-gold" />
                        <h3 className="text-lg font-serif font-bold text-primary-dark">Attendance Calendar</h3>
                    </div>
                    <AttendanceCalendar history={attendanceHistory} />
                </div>
            </div>
        </div>
    );
}
