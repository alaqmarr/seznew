import { prisma } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { OrnateHeading, OrnateCard } from "@/components/ui/premium-components";
import { ModuleForm } from "./ModuleForm";
import { ModuleList } from "./ModuleList";

export const dynamic = 'force-dynamic';

export default async function ModulesPage() {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role !== "ADMIN") {
        redirect("/login");
    }

    const modules = await prisma.module.findMany({
        orderBy: { name: 'asc' },
        include: {
            _count: { select: { userAccess: true } }
        }
    });

    return (
        <div className="min-h-screen bg-background-light py-12 px-6 mt-12">
            <div className="max-w-4xl mx-auto space-y-8">
                <OrnateHeading
                    title="Module Management"
                    subtitle="Create and manage access control modules"
                />

                {/* Add Module Form */}
                <OrnateCard className="p-6 border border-gold/20 shadow-xl bg-white/90">
                    <h3 className="text-lg font-bold text-primary-dark mb-4">Add New Module</h3>
                    <ModuleForm />
                </OrnateCard>

                {/* Module List */}
                <OrnateCard className="p-0 overflow-hidden border border-gold/20 shadow-xl bg-white/90">
                    <ModuleList modules={modules} />
                </OrnateCard>
            </div>
        </div>
    );
}
