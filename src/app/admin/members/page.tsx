import { prisma } from "@/lib/db";
import { hasModuleAccess } from "@/lib/access-control";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { OrnateHeading, OrnateCard } from "@/components/ui/premium-components";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { format } from "date-fns";
import { AdminActionButtons } from "@/components/admin/AdminActionButtons";

export const dynamic = 'force-dynamic';

export default async function MembersAdminPage() {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
        redirect("/login");
    }

    const userId = (session.user as any).id;
    const role = (session.user as any).role;
    const isAdmin = role === "ADMIN";

    const canAccess = isAdmin || await hasModuleAccess(userId, "/admin/members");

    if (!canAccess) {
        redirect("/login");
    }

    const members = await prisma.memberRegistration.findMany({
        orderBy: { createdAt: 'desc' }
    });

    return (
        <div className="min-h-screen bg-background-light py-12 px-6 mt-12">
            <div className="max-w-7xl mx-auto space-y-8">
                <OrnateHeading title="Committee Registrations" subtitle="Review and manage new member applications" />

                <OrnateCard className="p-0 overflow-hidden border border-gold/20 shadow-2xl bg-white/90 backdrop-blur-xl">
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-primary-dark/5 hover:bg-primary-dark/5 border-b border-primary/10">
                                    <TableHead className="py-5 px-6 text-primary-dark font-bold uppercase tracking-wider text-xs w-[100px]">ITS</TableHead>
                                    <TableHead className="py-5 px-6 text-primary-dark font-bold uppercase tracking-wider text-xs">Member Details</TableHead>
                                    <TableHead className="py-5 px-6 text-primary-dark font-bold uppercase tracking-wider text-xs">Contact Info</TableHead>
                                    <TableHead className="py-5 px-6 text-primary-dark font-bold uppercase tracking-wider text-xs">Qualifications</TableHead>
                                    <TableHead className="py-5 px-6 text-primary-dark font-bold uppercase tracking-wider text-xs text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {members.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={5} className="text-center py-24 text-neutral-400">
                                            <p className="font-serif text-lg text-neutral-600 mb-1">No registrations yet</p>
                                            <p className="text-sm">As members join, they will appear here.</p>
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    members.map((m) => (
                                        <TableRow key={m.id} className="hover:bg-gold/5 transition-colors border-b border-neutral-100 text-sm">
                                            <TableCell className="py-5 px-6 font-mono font-bold text-primary-dark/80 bg-neutral-50/50">{m.its}</TableCell>
                                            <TableCell className="py-5 px-6">
                                                <div className="flex flex-col gap-0.5">
                                                    <span className="font-bold text-neutral-800 text-base">{m.title} {m.name}</span>
                                                    <span className="text-xs text-neutral-500 font-medium">Born: {format(new Date(m.dob), "PPP")}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell className="py-5 px-6">
                                                <div className="flex flex-col gap-1">
                                                    <a href={`mailto:${m.email}`} className="text-primary hover:text-gold transition-colors font-medium truncate max-w-[180px]">{m.email}</a>
                                                    <span className="font-mono text-neutral-500 text-xs tracking-wide">{m.phone}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell className="py-5 px-6">
                                                <div className="flex flex-wrap gap-2">
                                                    {m.quranHifz && <span className="inline-flex items-center px-2 py-1 rounded bg-emerald-50 text-emerald-700 text-[10px] font-bold border border-emerald-100 uppercase tracking-wide">{m.quranHifz}</span>}
                                                    <span className="text-xs text-neutral-600">{m.occupation}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell className="py-5 px-6 text-right">
                                                <AdminActionButtons
                                                    id={m.id}
                                                    currentStatus={m.status}
                                                    type="member"
                                                />
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </OrnateCard>
            </div>
        </div>
    );
}
