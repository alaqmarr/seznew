import { requireAccess } from "@/lib/access-control";
import { getUserByITS } from "@/app/actions/users";
import { SearchUserClient } from "./SearchUserClient";
import { EditUserClient } from "./EditUserClient";
import { redirect } from "next/navigation";

interface PageProps {
    searchParams: Promise<{ ITS?: string }>;
}

export default async function EditUserPage({ searchParams }: PageProps) {
    // User requested specific access for "edit-member-details". 
    // In our system, we check access by Path. So we expect the "Edit Member Details" module 
    // to have a link to "/admin/edit-user".
    const { authorized, role } = await requireAccess("/admin/edit-user");
    if (!authorized) redirect("/");

    const awaitedParams = await searchParams; // Next.js 15+ needs await, but to be sure for 14 too
    const its = awaitedParams.ITS;

    if (!its) {
        return <SearchUserClient />;
    }

    const res = await getUserByITS(its);
    if (!res.success || !res.user) {
        return <SearchUserClient error={`User with ITS '${its}' not found.`} />;
    }

    return (
        <div className="min-h-screen bg-background-light p-6">
            <EditUserClient user={res.user} currentUserRole={role || "USER"} />
        </div>
    );
}
