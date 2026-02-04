import { prisma } from "@/lib/db";
import { hasModuleAccess } from "@/lib/access-control";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { OrnateHeading, OrnateCard } from "@/components/ui/premium-components";
import { ModuleForm } from "./ModuleForm";
import { ModuleList } from "./ModuleList";
import { HallModuleGenerator } from "./HallModuleGenerator";
import { getHallModuleStatus } from "@/app/actions/modules";
import { AddModuleDrawer } from "./AddModuleDrawer";

export const dynamic = 'force-dynamic';

export default async function ModulesPage() {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
        redirect("/login");
    }

    const userId = (session.user as any).id;
    const role = (session.user as any).role;
    const isAdmin = role === "ADMIN";

    const canAccess = isAdmin || await hasModuleAccess(userId, "/admin/modules");

    if (!canAccess) {
        redirect("/login");
    }

    const modules = await prisma.module.findMany({
        orderBy: { name: 'asc' },
        include: {
            links: { orderBy: { order: 'asc' } },
            _count: { select: { userAccess: true } }
        }
    });

    const hallStatus = await getHallModuleStatus();

    return (
        <div className="min-h-screen bg-background-light py-12 px-6 mt-12">
            <div className="max-w-6xl mx-auto space-y-8">
                <div className="flex flex-col md:flex-row justify-between items-center gap-6">
                    <OrnateHeading
                        title="Module Management"
                        subtitle="Create and manage access control modules"
                        className="mb-0 text-center md:text-left"
                    />
                    <AddModuleDrawer />
                </div>

                {/* Module List */}
                <OrnateCard className="p-0 overflow-hidden border border-gold/20 shadow-xl bg-white/90">
                    <ModuleList modules={modules} />
                </OrnateCard>

                {/* Hall Module Generator */}
                {hallStatus.length > 0 && (
                    <OrnateCard className="p-6 border border-gold/20 shadow-xl bg-white/90">
                        <h3 className="text-lg font-bold text-primary-dark mb-4">Quick Generate Hall Modules</h3>
                        <HallModuleGenerator initialStatus={hallStatus} />
                    </OrnateCard>
                )}
            </div>
        </div>
    );
}
