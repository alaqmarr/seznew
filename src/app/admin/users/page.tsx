import { prisma } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { OrnateHeading, OrnateCard } from "@/components/ui/premium-components";
import { UserList } from "./UserList";
import { AddUserForm } from "./AddUserForm";
import { BulkUpload } from "./BulkUpload";
import { hasModuleAccess } from "@/lib/access-control";

export const dynamic = 'force-dynamic';

export default async function UsersAdminPage() {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
        redirect("/login");
    }

    const userId = (session.user as any).id;
    const role = (session.user as any).role;
    const isAdmin = role === "ADMIN";

    // Check if user has module access to this page
    const canAccess = isAdmin || await hasModuleAccess(userId, "/admin/users");

    if (!canAccess) {
        redirect("/login");
    }

    const users = await prisma.user.findMany({
        orderBy: { createdAt: 'desc' },
        select: {
            id: true,
            username: true,
            name: true,
            email: true,
            mobile: true,
            role: true,
            createdAt: true,
            its: true,
        },
    });

    return (
        <div className="min-h-screen bg-background-light py-12 px-6 mt-12">
            <div className="max-w-7xl mx-auto space-y-8">
                <OrnateHeading
                    title="User Management"
                    subtitle="Add, edit, and manage system users"
                />

                {/* Add User Section */}
                <div className="grid md:grid-cols-2 gap-6">
                    <OrnateCard className="p-6 border border-gold/20 shadow-xl bg-white/90">
                        <h3 className="text-lg font-bold text-primary-dark mb-4">Add Single User</h3>
                        <AddUserForm />
                    </OrnateCard>

                    <OrnateCard className="p-6 border border-gold/20 shadow-xl bg-white/90">
                        <h3 className="text-lg font-bold text-primary-dark mb-4">Bulk Upload from Excel</h3>
                        <BulkUpload />
                    </OrnateCard>
                </div>

                {/* Users List */}
                <OrnateCard className="p-0 overflow-hidden border border-gold/20 shadow-xl bg-white/90">
                    <div className="p-6 border-b border-neutral-100">
                        <h3 className="text-lg font-bold text-primary-dark">All Users ({users.length})</h3>
                    </div>
                    <UserList users={users} currentUserId={(session.user as any).id} />
                </OrnateCard>
            </div>
        </div>
    );
}
