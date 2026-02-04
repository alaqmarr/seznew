"use client";

import { useState, useEffect } from "react";
import { getFloorMembersForUser, markUserAttendance, getAttendanceStatusForEvent } from "@/app/actions/attendance-taker";
import { OrnateCard, OrnateHeading } from "@/components/ui/premium-components";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CheckCircle2, Circle, Search, Users } from "lucide-react";
import toast from "react-hot-toast";

type SimpleUser = { id: string; name: string | null; its: string | null; username: string };

export function AttendanceTaker({
    activeEvent,
    currentUser
}: {
    activeEvent: any,
    currentUser: { id: string; name: string }
}) {
    const [members, setMembers] = useState<SimpleUser[]>([]);
    const [attendanceMap, setAttendanceMap] = useState<Record<string, boolean>>({});
    const [search, setSearch] = useState("");
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadData();
    }, [activeEvent]);

    const loadData = async () => {
        if (!activeEvent) {
            setLoading(false);
            return;
        }

        // 1. Load my members
        const memRes = await getFloorMembersForUser(currentUser.id);
        if (memRes.success && memRes.data) {
            setMembers(memRes.data as SimpleUser[]);

            // 2. Load their status for this event
            const ids = (memRes.data as SimpleUser[]).map(u => u.id);
            const statusRes = await getAttendanceStatusForEvent(activeEvent.id, ids);

            if (statusRes.success && statusRes.data) {
                const map: Record<string, boolean> = {};
                statusRes.data.forEach((r: any) => {
                    if (r.status === "PRESENT") map[r.userId] = true;
                });
                setAttendanceMap(map);
            }
        }
        setLoading(false);
    };

    const toggleAttendance = async (memberId: string) => {
        // Optimistic update
        const isPresent = !!attendanceMap[memberId];
        const newStatus = !isPresent;

        setAttendanceMap(prev => ({ ...prev, [memberId]: newStatus }));

        // Server Call
        const res = await markUserAttendance(activeEvent.id, memberId, currentUser.id, newStatus ? "PRESENT" : "ABSENT");
        if (!res.success) {
            // Revert on error
            setAttendanceMap(prev => ({ ...prev, [memberId]: isPresent }));
            toast.error("Failed to update attendance");
        }
    };

    const filteredMembers = members.filter(m =>
    (m.name?.toLowerCase().includes(search.toLowerCase()) ||
        m.username.toLowerCase().includes(search.toLowerCase()) ||
        m.its?.includes(search))
    );

    if (!activeEvent) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[50vh] text-center p-6">
                <OrnateCard className="p-8 max-w-md">
                    <h2 className="text-xl font-bold font-serif text-gray-400">No Active Event</h2>
                    <p className="text-gray-500 mt-2">Attendance is currently closed. Please wait for an event to start.</p>
                </OrnateCard>
            </div>
        );
    }

    return (
        <div className="space-y-6 max-w-lg mx-auto pb-20">
            <OrnateHeading
                title={activeEvent.name}
                subtitle="Mark Attendance"
            />

            <div className="sticky top-20 z-10 bg-background-light pt-2 pb-4">
                <div className="relative">
                    <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search name or ITS..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="pl-9 bg-white shadow-sm border-gold/20"
                    />
                </div>
            </div>

            {loading ? (
                <div className="text-center py-10">Loading members...</div>
            ) : (
                <div className="space-y-3">
                    {filteredMembers.map(member => {
                        const isPresent = !!attendanceMap[member.id];
                        return (
                            <div
                                key={member.id}
                                onClick={() => toggleAttendance(member.id)}
                                className={`
                                    flex items-center justify-between p-4 rounded-xl border cursor-pointer transition-all duration-200
                                    ${isPresent
                                        ? "bg-green-50 border-green-200 shadow-md transform scale-[1.01]"
                                        : "bg-white border-gold/10 hover:bg-gold/5"
                                    }
                                `}
                            >
                                <div>
                                    <h4 className={`font-bold ${isPresent ? "text-green-800" : "text-gray-800"}`}>
                                        {member.name || member.username}
                                    </h4>
                                    <p className="text-xs text-gray-500">{member.its || "No ITS"}</p>
                                </div>
                                <div className={`
                                    w-8 h-8 rounded-full flex items-center justify-center transition-colors
                                    ${isPresent ? "bg-green-500 text-white" : "bg-gray-100 text-gray-300"}
                                `}>
                                    {isPresent ? <CheckCircle2 className="w-5 h-5" /> : <Circle className="w-5 h-5" />}
                                </div>
                            </div>
                        );
                    })}
                    {filteredMembers.length === 0 && (
                        <p className="text-center text-gray-500">No members found.</p>
                    )}
                </div>
            )}
        </div>
    );
}
