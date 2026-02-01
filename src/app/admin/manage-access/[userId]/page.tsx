import { prisma } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import { OrnateHeading, OrnateCard } from "@/components/ui/premium-components";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { UserModuleEditor } from "./UserModuleEditor";

export const dynamic = 'force-dynamic';

interface PageProps {
    params: Promise<{ userId: string }>;
}

export default async function UserAccessPage({ params }: PageProps) {
    const { userId } = await params;

    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role !== "ADMIN") {
        redirect("/login");
    }

    const user = await prisma.user.findUnique({
        where: { id: userId },
        include: {
            moduleAccess: {
                include: { module: true }
            }
        }
    });

    if (!user) {
        notFound();
    }

    const allModules = await prisma.module.findMany({
        orderBy: { name: 'asc' },
        include: { links: { orderBy: { order: 'asc' } } }
    });

    const grantedModuleIds = user.moduleAccess.map(access => access.moduleId);

    return (
        <div className="min-h-screen bg-background-light py-12 px-6 mt-12">
            <div className="max-w-3xl mx-auto space-y-8">
                <div className="flex items-center gap-4">
                    <Link
                        href="/admin/manage-access"
                        className="p-2 rounded-lg hover:bg-gold/10 text-neutral-600 hover:text-primary transition-colors"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </Link>
                    <OrnateHeading
                        title={user.name || user.username}
                        subtitle={`Manage module access for @${user.username}`}
                    />
                </div>

                {/* User Info Card */}
                <OrnateCard className="p-6 border border-gold/20 shadow-xl bg-white/90">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-neutral-500">Role</p>
                            <p className="font-bold text-primary-dark">{user.role}</p>
                        </div>
                        <div className="text-right">
                            <p className="text-sm text-neutral-500">Modules Assigned</p>
                            <p className="font-bold text-primary-dark text-2xl">{grantedModuleIds.length}</p>
                        </div>
                    </div>
                </OrnateCard>

                {/* Module Editor */}
                <OrnateCard className="p-6 border border-gold/20 shadow-xl bg-white/90">
                    <UserModuleEditor
                        userId={userId}
                        allModules={allModules}
                        grantedModuleIds={grantedModuleIds}
                    />
                </OrnateCard>
            </div>
        </div>
    );
}
