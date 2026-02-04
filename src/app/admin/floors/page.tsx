import { redirect } from "next/navigation";
import { requireAccess } from "@/lib/access-control";
import { getAllFloors } from "@/app/actions/floors";
import { FloorManager } from "./FloorManager";

export default async function FloorsPage() {
    const { authorized } = await requireAccess("/admin/floors");
    if (!authorized) redirect("/");

    const floorsResult = await getAllFloors();
    const floors = floorsResult.success && floorsResult.data ? floorsResult.data : [];

    return (
        <div className="min-h-screen bg-background-light py-12 px-6 mt-12">
            <div className="max-w-6xl mx-auto">
                <FloorManager initialFloors={floors} />
            </div>
        </div>
    );
}
