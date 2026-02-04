import { redirect } from "next/navigation";
import { requireAccess } from "@/lib/access-control";
import { getAllFloors, getUserFloorRole } from "@/app/actions/floors";
import { FloorManager } from "./FloorManager";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export default async function FloorsPage() {
    const session = await getServerSession(authOptions);
    if (!session?.user) redirect("/login");

    const userId = (session.user as any).id;
    const userRole = (session.user as any).role; // Global role (ADMIN, USER)

    // Check Module Access First
    const { authorized } = await requireAccess("/admin/floors");
    if (!authorized) redirect("/unauthorized");

    // Fetch Floor-Specific Role (HEAD, SUBHEAD, MEMBER)
    const floorRoleInfo = await getUserFloorRole(userId);

    // Determine Permissions
    let effectiveRole = "USER";
    if (userRole === "ADMIN") effectiveRole = "ADMIN";
    else if (floorRoleInfo?.role === "HEAD") effectiveRole = "HEAD";
    else if (floorRoleInfo?.role === "SUBHEAD") effectiveRole = "SUBHEAD";
    else if (floorRoleInfo?.role === "MEMBER") {
        // Members cannot access this page at all
        redirect("/unauthorized");
    }

    // Fetch Floors Data
    const floorsResult = await getAllFloors();
    let floors = floorsResult.success && floorsResult.data ? floorsResult.data : [];

    // If not Admin, strictly filter floors
    if (effectiveRole !== "ADMIN") {
        if (floorRoleInfo?.floorId) {
            floors = floors.filter(f => f.id === floorRoleInfo.floorId);
        } else {
            // User has access to the page but is not assigned to any floor
            floors = [];
        }
    }

    return (
        <div className="min-h-screen bg-background-light py-12 px-6 mt-12">
            <div className="max-w-6xl mx-auto">
                <FloorManager
                    initialFloors={floors}
                    userRole={effectiveRole}
                    assignedFloorId={floorRoleInfo?.floorId}
                />
            </div>
        </div>
    );
}
