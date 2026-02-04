"use client";


import { useState } from "react";
import { createAttendanceSession, stopAttendanceSession } from "@/app/actions/attendance";
import { OrnateCard, GoldenButton, OrnateHeading } from "@/components/ui/premium-components";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import toast from "react-hot-toast";
import { addHours, format, isSameDay } from "date-fns";
import { Calendar, Clock, Play, StopCircle, CheckCircle2, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

export function AttendanceAdmin({ activeSessions, events }: { activeSessions: any[], events: any[] }) {
    const [processingId, setProcessingId] = useState<string | null>(null);

    const handleStartSession = async (event: any) => {
        if (processingId) return;
        setProcessingId(event.id);

        let start = new Date(event.occasionDate);
        // Parse time if present (string "HH:mm")
        if (event.occasionTime) {
            const [h, m] = event.occasionTime.split(':').map(Number);
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
        if (!confirm("Stop this attendance session? users will no longer be able to mark attendance.")) return;
        setProcessingId(eventId);
        const res = await stopAttendanceSession(eventId);
        if (res.success) {
            toast.success("Attendance session closed.");
            window.location.reload();
        } else {
            setProcessingId(null);
        }
    };

    // Filter out events that are already active
    const activeEventIds = activeSessions.map(s => s.eventId);
    const availableEvents = events.filter(e => !activeEventIds.includes(e.id));

    return (
        <div className="space-y-10">
            <OrnateHeading title="Attendance Manager" subtitle="Control active attendance sessions and upcoming events" />

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* LEFT COLUMN: Active Sessions */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="flex items-center gap-2 mb-4">
                        <div className="p-2 bg-green-100 rounded-full text-green-700">
                            <CheckCircle2 className="w-5 h-5" />
                        </div>
                        <h3 className="text-xl font-bold font-serif text-primary-dark">Active Sessions ({activeSessions.length})</h3>
                    </div>

                    {activeSessions.length === 0 ? (
                        <div className="p-8 border-2 border-dashed border-neutral-200 rounded-2xl bg-white/50 text-center">
                            <p className="text-neutral-400 font-medium">No sessions currently active.</p>
                            <p className="text-xs text-neutral-400 mt-1">Select an event from the list to start tracking.</p>
                        </div>
                    ) : (
                        <div className="grid gap-4">
                            {activeSessions.map(session => (
                                <div key={session.id} className="group relative bg-white border border-green-100 shadow-sm hover:shadow-md rounded-xl overflow-hidden transition-all">
                                    <div className="absolute top-0 left-0 w-1 h-full bg-green-500" />
                                    <div className="p-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                                        <div>
                                            <div className="flex items-center gap-2 mb-1">
                                                <h4 className="font-bold text-lg text-primary-dark">{session.event.name}</h4>
                                                <Badge className="bg-green-100 text-green-700 hover:bg-green-200 border-green-200 shadow-none">
                                                    <span className="w-1.5 h-1.5 rounded-full bg-green-600 mr-1.5 animate-pulse" />
                                                    LIVE
                                                </Badge>
                                            </div>
                                            <div className="flex items-center gap-4 text-sm text-neutral-500">
                                                <div className="flex items-center gap-1.5">
                                                    <Calendar className="w-3.5 h-3.5" />
                                                    {format(new Date(session.startTime), 'MMM d, yyyy')}
                                                </div>
                                                <div className="flex items-center gap-1.5">
                                                    <Clock className="w-3.5 h-3.5" />
                                                    {format(new Date(session.startTime), 'h:mm a')} - {format(new Date(session.endTime), 'h:mm a')}
                                                </div>
                                            </div>
                                        </div>

                                        <Button
                                            variant="destructive"
                                            size="sm"
                                            onClick={() => handleStop(session.eventId)}
                                            disabled={processingId === session.eventId}
                                            className="w-full md:w-auto shadow-sm hover:bg-red-600"
                                        >
                                            <StopCircle className="w-4 h-4 mr-2" />
                                            Stop Session
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* RIGHT COLUMN: Upcoming Events */}
                <div className="space-y-4">
                    <div className="flex items-center gap-2 mb-4">
                        <div className="p-2 bg-gold/10 rounded-full text-gold">
                            <Calendar className="w-5 h-5" />
                        </div>
                        <h3 className="text-xl font-bold font-serif text-primary-dark">Upcoming Events</h3>
                    </div>

                    <div className="bg-white rounded-2xl border border-neutral-100 shadow-sm overflow-hidden">
                        <div className="max-h-[600px] overflow-y-auto custom-scrollbar p-2 space-y-2">
                            {availableEvents.length === 0 ? (
                                <div className="p-8 text-center text-neutral-400">
                                    <p>No upcoming events found.</p>
                                </div>
                            ) : availableEvents.map((event) => (
                                <div
                                    key={event.id}
                                    className="p-3 rounded-xl border border-transparent hover:border-gold/20 hover:bg-neutral-50 transition-all group"
                                >
                                    <div className="flex justify-between items-start gap-3">
                                        <div className="flex-1 min-w-0">
                                            <h5 className="font-bold text-neutral-800 text-sm truncate" title={event.name}>
                                                {event.name}
                                            </h5>
                                            <div className="flex items-center gap-2 mt-1 text-xs text-neutral-500">
                                                <span className={cn(
                                                    "px-1.5 py-0.5 rounded font-medium",
                                                    isSameDay(new Date(event.occasionDate), new Date())
                                                        ? "bg-blue-50 text-blue-600"
                                                        : "bg-neutral-100 text-neutral-500"
                                                )}>
                                                    {isSameDay(new Date(event.occasionDate), new Date()) ? "Today" : format(new Date(event.occasionDate), 'MMM d')}
                                                </span>
                                                {event.occasionTime && (
                                                    <span className="flex items-center gap-0.5">
                                                        <Clock className="w-3 h-3" />
                                                        {event.occasionTime}
                                                    </span>
                                                )}
                                            </div>
                                        </div>

                                        <GoldenButton
                                            className="h-8 w-8 p-0 rounded-full shadow-none group-hover:shadow-md transition-all"
                                            onClick={() => handleStartSession(event)}
                                            disabled={processingId === event.id}
                                            title="Activate Session"
                                        >
                                            <Play className="w-3.5 h-3.5 ml-0.5" />
                                        </GoldenButton>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div className="p-3 bg-neutral-50 border-t border-neutral-100 text-[10px] text-neutral-400 text-center">
                            Sorted by nearest date first
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
