import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { hasModuleAccess } from "@/lib/access-control";
import { getAllAttendanceEvents } from "@/app/actions/attendance";
import { MasterAttendanceList } from "./MasterAttendanceList";
import { OrnateHeading } from "@/components/ui/premium-components";

export default async function AttendanceAnalyticsPage() {
    const session = await getServerSession(authOptions);
    if (!session?.user) redirect("/login");

    const userId = (session.user as any).id;
    const canAccess = (session.user as any).role === "ADMIN" || await hasModuleAccess(userId, "/admin/attendance-details");

    if (!canAccess) redirect("/unauthorized");

    const result = await getAllAttendanceEvents();
    const events = result.success && result.data ? result.data : [];

    return (
        <div className="container mx-auto py-10 px-4 space-y-10 min-h-screen bg-background-light mt-12">
            <OrnateHeading
                title="Master Attendance"
                subtitle="Manage events and attendance records"
            />
            <MasterAttendanceList initialEvents={events} />
        </div>
    );
}
