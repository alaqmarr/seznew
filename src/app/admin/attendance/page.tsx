import { redirect } from "next/navigation";
import { requireAccess } from "@/lib/access-control";
import { getActiveSessions, getCloneableEvents } from "@/app/actions/attendance";
import { AttendanceAdmin } from "./AttendanceAdmin";

export default async function AttendanceAdminPage() {
    const { authorized } = await requireAccess("/admin/attendance");
    if (!authorized) redirect("/");

    const activeRes = await getActiveSessions();
    const eventsRes = await getCloneableEvents();

    const activeSessions = activeRes.success && activeRes.data ? activeRes.data : [];
    const events = eventsRes.success && eventsRes.data ? eventsRes.data : [];

    return (
        <div className="min-h-screen bg-background-light py-12 px-6 mt-12">
            <div className="max-w-4xl mx-auto">
                <AttendanceAdmin activeSessions={activeSessions} events={events} />
            </div>
        </div>
    );
}
