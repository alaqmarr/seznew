import { redirect } from "next/navigation";
import { requireAccess } from "@/lib/access-control";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth"; // Need to ensure this path is correct, or just use user info from session
import { getActiveAttendanceEvent } from "@/lib/attendance";
import { AttendanceTaker } from "./AttendanceTaker";
import { prisma } from "@/lib/db";

export default async function TakeAttendancePage() {
    // 1. Access Check
    const { authorized, userId } = await requireAccess("/admin/take-attendance");
    if (!authorized || !userId) redirect("/");

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) redirect("/");

    // 2. Get Active Event
    const activeInfo = await getActiveAttendanceEvent();
    const activeEvent = activeInfo ? activeInfo.event : null;

    return (
        <div className="min-h-screen bg-background-light py-8 px-4 mt-12">
            <AttendanceTaker
                activeEvent={activeEvent}
                currentUser={{ id: user.id || "", name: user.name || user.username || "" }}
            />
        </div>
    );
}
