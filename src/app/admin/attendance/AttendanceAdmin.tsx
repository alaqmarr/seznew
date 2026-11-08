"use client";

import { useState } from "react";
import { createAttendanceSession, stopAttendanceSession } from "@/app/actions/attendance";
import { OrnateCard, GoldenButton, OrnateHeading } from "@/components/ui/premium-components";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import toast from "react-hot-toast";
import { addHours, format, isSameDay } from "date-fns";
import { Calendar, Clock, Play, StopCircle, Hourglass } from "lucide-react";
import { cn } from "@/lib/utils";

function parseOccasionTime(timeStr?: string | null): { h: number; m: number } {
    if (!timeStr) return { h: 19, m: 30 };
    const trimmed = timeStr.trim();
    const ampm = trimmed.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
    if (ampm) {
        let h = parseInt(ampm[1], 10);
        const m = parseInt(ampm[2], 10);
        const period = ampm[3].toUpperCase();
        if (period === "PM" && h !== 12) h += 12;
        if (period === "AM" && h === 12) h = 0;
        return { h, m };
    }
    const twentyFour = trimmed.match(/^(\d{1,2}):(\d{2})/);
    if (twentyFour) {
        return {
            h: parseInt(twentyFour[1], 10) || 0,
            m: parseInt(twentyFour[2], 10) || 0,
        };
    }
    return { h: 19, m: 30 };
}

export function AttendanceAdmin({ activeSessions, events }: { activeSessions: any[], events: any[] }) {
    const [processingId, setProcessingId] = useState<string | null>(null);

    const handleStartSession = async (event: any) => {
        if (processingId) return;
        setProcessingId(event.id);

        const start = new Date(event.occasionDate);
        if (event.occasionTime) {
            const { h, m } = parseOccasionTime(event.occasionTime);
            start.setHours(h, m, 0, 0);
        }

        // Default duration: 6 hours
        const end = addHours(start, 6);

        const res = await createAttendanceSession(event.id, start, end);
        if (res.success) {
            toast.success(`Session started for ${event.name}`);
            window.location.reload();
        } else {
            toast.error(res.error || "Failed to start session");
            setProcessingId(null);
        }
    };

    const handleStop = async (eventId: string) => {
        if (!confirm("Stop this attendance session? Users will no longer be able to mark attendance.")) return;
        setProcessingId(eventId);
        const res = await stopAttendanceSession(eventId);
        if (res.success) {
            toast.success("Attendance session closed.");
            window.location.reload();
        } else {
            toast.error("Failed to stop session");
            setProcessingId(null);
        }
    };

    // Filter out events that are already active
    const activeEventIds = activeSessions.map(s => s.eventId);
    const availableEvents = events.filter(e => !activeEventIds.includes(e.id));

    return (
        <div className="space-y-8 pb-12">
            <OrnateHeading
                title="Attendance Manager"
                subtitle="Control Active Sessions & Upcoming Events"
            />

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
                {/* LEFT COLUMN: Active Sessions */}
                <div className="lg:col-span-2 space-y-6">
                    <OrnateCard className="bg-white/90 border-emerald-100/50 min-h-[400px] p-0 overflow-hidden">
                        <div className="p-6 border-b border-gray-100/80 bg-gray-50/50">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-white rounded-2xl text-emerald-600 shadow-sm border border-emerald-100">
                                    <Hourglass className="w-6 h-6 animate-pulse" />
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold font-serif text-primary-dark">Active Sessions</h3>
                                    <p className="text-sm text-gray-500 mt-1">Currently tracking attendance for these events</p>
                                </div>
                                <Badge className="ml-auto bg-emerald-100 text-emerald-700 hover:bg-emerald-200 border-emerald-200 shadow-sm px-3 py-1 text-sm">
                                    {activeSessions.length} Active
                                </Badge>
                            </div>
                        </div>

                        <div className="p-6">
                            {activeSessions.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-12 text-center space-y-4 opacity-70">
                                    <div className="p-6 bg-gray-50 rounded-full border border-gray-100">
                                        <Clock className="w-10 h-10 text-gray-300" />
                                    </div>
                                    <div>
                                        <p className="text-gray-600 font-medium text-lg">No sessions active</p>
                                        <p className="text-sm text-gray-400 mt-1 max-w-xs mx-auto">Select an upcoming event to start tracking.</p>
                                    </div>
                                </div>
                            ) : (
                                <div className="grid gap-5">
                                    {activeSessions.map(session => (
                                        <div key={session.id} className="group relative bg-white border border-emerald-100/60 shadow-sm hover:shadow-md rounded-2xl overflow-hidden transition-all duration-300 ring-1 ring-black/5">
                                            <div className="absolute top-0 left-0 w-1.5 h-full bg-gradient-to-b from-emerald-400 to-emerald-600" />

                                            <div className="p-5 pl-7 flex flex-col md:flex-row justify-between items-start md:items-center gap-5">
                                                <div className="space-y-2">
                                                    <div className="flex items-center gap-3">
                                                        <h4 className="font-serif font-bold text-xl text-gray-800 group-hover:text-primary-dark transition-colors">{session.event.name}</h4>
                                                        <Badge className="bg-red-50 text-red-600 border-red-100 shadow-none px-2 py-0.5 text-[10px] animate-pulse font-bold tracking-wider">
                                                            <span className="w-1.5 h-1.5 rounded-full bg-red-500 mr-1.5" />
                                                            LIVE
                                                        </Badge>
                                                    </div>

                                                    <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-gray-500">
                                                        <div className="flex items-center gap-1.5 bg-gray-50 px-2.5 py-1 rounded-md border border-gray-100">
                                                            <Calendar className="w-3.5 h-3.5 text-gray-400" />
                                                            <span>{format(new Date(session.startTime), "MMM d, yyyy")}</span>
                                                        </div>
                                                        <div className="flex items-center gap-1.5 bg-gray-50 px-2.5 py-1 rounded-md border border-gray-100">
                                                            <Clock className="w-3.5 h-3.5 text-gray-400" />
                                                            <span className="font-mono text-xs">
                                                                {format(new Date(session.startTime), "h:mm a")} - {format(new Date(session.endTime), "h:mm a")}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>

                                                <Button
                                                    variant="outline"
                                                    onClick={() => handleStop(session.eventId)}
                                                    disabled={processingId === session.eventId}
                                                    className="w-full md:w-auto border-red-100 text-red-600 hover:bg-red-50 hover:text-red-700 hover:border-red-200 shadow-sm transition-all h-10 px-6 rounded-xl"
                                                >
                                                    {processingId === session.eventId ? (
                                                        <span className="animate-spin mr-2">⏳</span>
                                                    ) : (
                                                        <StopCircle className="w-4 h-4 mr-2" />
                                                    )}
                                                    End Session
                                                </Button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </OrnateCard>
                </div>

                {/* RIGHT COLUMN: Upcoming Events */}
                <div className="space-y-4">
                    <OrnateCard className="bg-white/90 border-gold/20 flex flex-col p-0 overflow-hidden shadow-lg h-[600px]">
                        <div className="p-5 border-b border-gold/10 bg-gradient-to-br from-gold/5 to-transparent">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-white rounded-lg text-primary-dark shadow-sm ring-1 ring-gold/20">
                                    <Calendar className="w-5 h-5" />
                                </div>
                                <h3 className="text-lg font-serif font-bold text-gray-800">Upcoming Events</h3>
                            </div>
                        </div>

                        <div className="overflow-y-auto custom-scrollbar p-4 space-y-3 flex-grow bg-gray-50/30">
                            {availableEvents.length === 0 ? (
                                <div className="p-8 text-center text-gray-400 bg-white rounded-xl border border-dashed border-gray-200 mt-4">
                                    <p className="text-sm font-medium">No details found</p>
                                </div>
                            ) : availableEvents.map((event) => (
                                <div
                                    key={event.id}
                                    className="p-4 rounded-xl border border-gray-100 bg-white hover:border-gold/30 hover:shadow-md transition-all group flex flex-row items-center justify-between gap-4"
                                >
                                    <div className="min-w-0 flex-1">
                                        <h5 className="font-bold text-gray-800 text-sm leading-tight mb-1.5 truncate text-wrap" title={event.name}>
                                            {event.name}
                                        </h5>
                                        <div className="flex items-center gap-2">
                                            <Badge variant="secondary" className={cn(
                                                "text-[10px] px-1.5 py-0 rounded-md font-medium shadow-none border",
                                                isSameDay(new Date(event.occasionDate), new Date())
                                                    ? "bg-blue-50 text-blue-700 border-blue-100"
                                                    : "bg-gray-50 text-gray-500 border-gray-100"
                                            )}>
                                                {isSameDay(new Date(event.occasionDate), new Date()) ? "Today" : format(new Date(event.occasionDate), "MMM d")}
                                            </Badge>

                                            {event.occasionTime && (
                                                <span className="text-[10px] text-gray-400 font-mono flex items-center gap-1">
                                                    <Clock className="w-3 h-3" />
                                                    {event.occasionTime}
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    <GoldenButton
                                        className="h-9 w-9 p-0 rounded-full shadow-sm hover:shadow-md flex-shrink-0 flex items-center justify-center bg-gradient-to-br from-gold to-amber-400"
                                        onClick={() => handleStartSession(event)}
                                        disabled={processingId === event.id}
                                        title="Start Session"
                                    >
                                        <Play className="w-3.5 h-3.5 fill-white text-white ml-0.5" />
                                    </GoldenButton>
                                </div>
                            ))}
                        </div>
                    </OrnateCard>
                </div>
            </div>
        </div>
    );
}
