import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { OrnateHeading, OrnateCard } from "@/components/ui/premium-components";
import { User, Shield, ShieldCheck, Users, ArrowUp } from "lucide-react";

export default async function TeamPage() {
    const session = await getServerSession(authOptions);
    if (!session?.user) redirect("/login");

    const userId = (session.user as any).id;

    // Fetch Full Hierarchy Context
    // 1. Get my floor
    // 2. Get my heads
    // 3. Get my subheads/members (if I am head/subhead)

    // Efficiently fetch user's floor relationships
    const userWithFloor = await prisma.user.findUnique({
        where: { id: userId },
        include: {
            floorHeadOf: { include: { heads: true, subHeads: true, members: true } },
            floorSubHeadOf: { include: { heads: true, subHeads: true, members: true } },
            floorMemberOf: { include: { heads: true, subHeads: true, members: true } },
        }
    });

    if (!userWithFloor) redirect("/login");

    // 3. Dedup and combine floors
    const allFloors = [
        ...userWithFloor.floorHeadOf,
        ...userWithFloor.floorSubHeadOf,
        ...userWithFloor.floorMemberOf
    ];

    // Unique floors by ID
    const myFloors = Array.from(new Map(allFloors.map(f => [f.id, f])).values());

    if (myFloors.length === 0) {
        return (
            <div className="min-h-screen bg-background-light py-12 px-6 mt-12">
                <div className="max-w-4xl mx-auto text-center">
                    <OrnateHeading title="My Team" subtitle="Organization Structure" />
                    <OrnateCard className="p-12 mt-8">
                        <div className="bg-gray-100 rounded-full p-6 inline-block mb-4">
                            <Users className="w-12 h-12 text-gray-400" />
                        </div>
                        <h3 className="text-xl font-bold text-gray-700">Not Assigned to a Team</h3>
                        <p className="text-gray-500 mt-2">You are currently not part of any floor or team hierarchy.</p>
                    </OrnateCard>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background-light py-12 px-4 sm:px-6 mt-12">
            <div className="max-w-5xl mx-auto space-y-16">
                {myFloors.map((floor) => (
                    <div key={floor.id} className="space-y-12">
                        <OrnateHeading title="My Team" subtitle={`${floor.name} Hierarchy`} />

                        {/* Tree Visualization */}
                        <div className="flex flex-col items-center space-y-8 relative">

                            {/* Level 1: Heads */}
                            <div className="relative z-10 w-full flex justify-center">
                                <div className="flex gap-6 flex-wrap justify-center">
                                    {floor.heads.map((head: { id: string; name?: string | null; username?: string | null; its?: string | null; }) => (
                                        <TeamMemberCard
                                            key={head.id}
                                            user={head}
                                            role="HEAD"
                                            isMe={head.id === userId}
                                        />
                                    ))}
                                    {floor.heads.length === 0 && <EmptyNode label="No Head Assigned" />}
                                </div>
                            </div>

                            {/* Connector 1 */}
                            <div className="w-px h-8 bg-gold/50 -my-2 relative z-0"></div>

                            {/* Level 2: SubHeads */}
                            <div className="relative z-10 w-full flex justify-center">
                                <div className="flex gap-6 flex-wrap justify-center p-4 rounded-3xl border border-gold/10 bg-white/30 backdrop-blur-sm">
                                    {floor.subHeads.map((sub: any) => (
                                        <TeamMemberCard
                                            key={sub.id}
                                            user={sub}
                                            role="SUBHEAD"
                                            isMe={sub.id === userId}
                                        />
                                    ))}
                                    {floor.subHeads.length === 0 && <EmptyNode label="No Sub-Heads" />}
                                </div>
                            </div>

                            {/* Connector 2 */}
                            <div className="w-px h-8 bg-gold/50 -my-2 relative z-0"></div>

                            {/* Level 3: Members */}
                            <div className="relative z-10 w-full">
                                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                                    {floor.members.map((member: any) => (
                                        <TeamMemberCard
                                            key={member.id}
                                            user={member}
                                            role="MEMBER"
                                            isMe={member.id === userId}
                                        />
                                    ))}
                                    {floor.members.length === 0 && (
                                        <div className="col-span-full text-center py-4 text-gray-400 italic text-sm">
                                            No members assigned
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

function TeamMemberCard({ user, role, isMe }: { user: any, role: "HEAD" | "SUBHEAD" | "MEMBER", isMe: boolean }) {
    const isHead = role === "HEAD";
    const isSubHead = role === "SUBHEAD";

    return (
        <div className={`
            flex flex-col items-center p-4 rounded-2xl transition-all duration-300
            ${isMe ? 'ring-2 ring-gold/50 shadow-lg scale-105 bg-white' : 'bg-white/80 hover:bg-white hover:shadow-md'}
            ${isHead ? 'border-b-4 border-amber-400 min-w-[160px]' : ''}
            ${isSubHead ? 'border-b-4 border-blue-400 min-w-[140px]' : ''}
            ${role === "MEMBER" ? 'border border-gray-100' : 'shadow-sm'}
        `}>
            <div className={`
                w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold text-white mb-2 shadow-sm
                ${isHead ? 'bg-gradient-to-br from-amber-400 to-amber-600' :
                    isSubHead ? 'bg-gradient-to-br from-blue-400 to-blue-600' :
                        'bg-gradient-to-br from-emerald-400 to-emerald-600'}
            `}>
                {user.name ? user.name.substring(0, 2).toUpperCase() : "U"}
            </div>

            <div className="text-center">
                <p className={`font-bold text-gray-800 leading-tight ${isHead ? 'text-base' : 'text-sm'}`}>
                    {user.name || user.username}
                </p>
                <p className="text-[10px] text-gray-500 font-mono mt-0.5">{user.its || "No ITS"}</p>
                {isMe && <span className="inline-block mt-1 px-2 py-0.5 bg-gold/10 text-[10px] font-bold text-gold rounded-full">YOU</span>}
            </div>

            {/* Role Badge */}
            <div className={`mt-2 text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full
                 ${isHead ? 'text-amber-600 bg-amber-50' :
                    isSubHead ? 'text-blue-600 bg-blue-50' :
                        'text-emerald-600 bg-emerald-50'}
            `}>
                {role}
            </div>
        </div>
    )
}

function EmptyNode({ label }: { label: string }) {
    return (
        <div className="flex flex-col items-center justify-center p-4 rounded-xl border-2 border-dashed border-gray-200 opacity-50">
            <span className="text-xs font-medium text-gray-400">{label}</span>
        </div>
    )
}
