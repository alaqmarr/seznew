import { prisma } from "@/lib/db";
import { hasModuleAccess } from "@/lib/access-control";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { OrnateHeading, OrnateCard } from "@/components/ui/premium-components";
import { UserAccessList } from "./UserAccessList";

export const dynamic = 'force-dynamic';

export default async function ManageAccessPage() {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
        redirect("/login");
    }

    const userId = (session.user as any).id;
    const role = (session.user as any).role;
    const isAdmin = role === "ADMIN";

    const canAccess = isAdmin || await hasModuleAccess(userId, "/admin/manage-access");

    if (!canAccess) {
        redirect("/login");
    }

    // Get all users except ADMIN (they have full access)
    // Also fetch their module access IDs for the drawer
    const users = await prisma.user.findMany({
        where: {
            role: { not: "ADMIN" }
        },
        orderBy: { name: 'asc' },
        include: {
            moduleAccess: { select: { moduleId: true } },
            _count: { select: { moduleAccess: true } }
        }
    });

    // Fetch available modules
    const allModules = await prisma.module.findMany({
        orderBy: { name: 'asc' },
        include: { links: true }
    });



    return (
        <div className="min-h-screen bg-background-light py-12 px-6 mt-12">
            <div className="max-w-5xl mx-auto space-y-8">
                <OrnateHeading
                    title="Manage User Access"
                    subtitle="Assign module permissions to users"
                />

                <OrnateCard className="p-6 border border-gold/20 shadow-xl bg-white/90">
                    <UserAccessList users={users} allModules={allModules} />
                </OrnateCard>
            </div>
        </div>
    );
}
