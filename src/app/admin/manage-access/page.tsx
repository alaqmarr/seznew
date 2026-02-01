import { prisma } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { OrnateHeading, OrnateCard } from "@/components/ui/premium-components";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import Link from "next/link";
import { ChevronRight, Shield, ShieldCheck, User } from "lucide-react";

export const dynamic = 'force-dynamic';

export default async function ManageAccessPage() {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role !== "ADMIN") {
        redirect("/login");
    }

    // Get all users except ADMIN (they have full access)
    const users = await prisma.user.findMany({
        where: {
            role: { not: "ADMIN" }
        },
        orderBy: { name: 'asc' },
        include: {
            _count: { select: { moduleAccess: true } }
        }
    });

    const getRoleBadge = (role: string) => {
        switch (role) {
            case "ADMIN_CUSTOM":
                return (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-gold/10 text-gold border border-gold/30 text-xs font-bold rounded-full uppercase">
                        <ShieldCheck className="w-3 h-3" /> Custom Admin
                    </span>
                );
            case "USER":
                return (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-50 text-blue-600 border border-blue-200 text-xs font-bold rounded-full uppercase">
                        <User className="w-3 h-3" /> User
                    </span>
                );
            default:
                return (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-neutral-100 text-neutral-600 text-xs font-bold rounded-full uppercase">
                        <Shield className="w-3 h-3" /> {role}
                    </span>
                );
        }
    };

    return (
        <div className="min-h-screen bg-background-light py-12 px-6 mt-12">
            <div className="max-w-5xl mx-auto space-y-8">
                <OrnateHeading
                    title="Manage User Access"
                    subtitle="Assign module permissions to users"
                />

                <OrnateCard className="p-0 overflow-hidden border border-gold/20 shadow-xl bg-white/90">
                    <Table>
                        <TableHeader>
                            <TableRow className="bg-primary-dark/5 hover:bg-primary-dark/5 border-b border-primary/10">
                                <TableHead className="py-4 px-6 text-primary-dark font-bold uppercase tracking-wider text-xs">User</TableHead>
                                <TableHead className="py-4 px-6 text-primary-dark font-bold uppercase tracking-wider text-xs">Role</TableHead>
                                <TableHead className="py-4 px-6 text-primary-dark font-bold uppercase tracking-wider text-xs text-center">Modules</TableHead>
                                <TableHead className="py-4 px-6 text-primary-dark font-bold uppercase tracking-wider text-xs text-right">Action</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {users.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={4} className="text-center py-16 text-neutral-400">
                                        <p className="font-serif text-lg text-neutral-600 mb-1">No users found</p>
                                        <p className="text-sm">Create users to manage their access.</p>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                users.map((user) => (
                                    <TableRow key={user.id} className="hover:bg-gold/5 transition-colors border-b border-neutral-100">
                                        <TableCell className="py-4 px-6">
                                            <div>
                                                <span className="font-bold text-neutral-800 block">{user.name || user.username}</span>
                                                <span className="text-xs text-neutral-500">@{user.username}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="py-4 px-6">
                                            {getRoleBadge(user.role)}
                                        </TableCell>
                                        <TableCell className="py-4 px-6 text-center">
                                            <span className="inline-flex items-center justify-center w-8 h-8 bg-primary/10 text-primary font-bold rounded-full text-sm">
                                                {user._count.moduleAccess}
                                            </span>
                                        </TableCell>
                                        <TableCell className="py-4 px-6 text-right">
                                            <Link
                                                href={`/admin/manage-access/${user.id}`}
                                                className="inline-flex items-center gap-1 px-4 py-2 bg-primary text-white text-sm font-bold rounded-lg hover:bg-primary-dark transition-colors"
                                            >
                                                Manage <ChevronRight className="w-4 h-4" />
                                            </Link>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </OrnateCard>
            </div>
        </div>
    );
}
