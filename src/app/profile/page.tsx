import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { OrnateHeading, OrnateCard } from "@/components/ui/premium-components";
import { ProfileForm } from "./ProfileForm";

export const dynamic = 'force-dynamic';

export default async function ProfilePage() {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
        redirect("/login");
    }

    const user = await prisma.user.findUnique({
        where: { id: (session.user as any).id },
        select: {
            id: true,
            username: true,
            name: true,
            email: true,
            mobile: true,
            role: true,
            createdAt: true,
        },
    });

    if (!user) {
        redirect("/login");
    }

    const userModules = await prisma.userModuleAccess.findMany({
        where: { userId: (session.user as any).id },
        include: { module: true }
    });

    return (
        <div className="min-h-screen py-20 px-4">
            <div className="max-w-2xl mx-auto space-y-8">
                <OrnateHeading
                    title="My Profile"
                    arabic="الملف الشخصي"
                />

                <OrnateCard className="p-8 border border-gold/20 shadow-2xl bg-white/90">
                    <ProfileForm user={user} assignedModules={userModules.map(m => m.module)} />
                </OrnateCard>
            </div>
        </div>
    );
}
