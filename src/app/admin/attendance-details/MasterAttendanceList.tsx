"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { deleteMasterEvent } from "@/app/actions/attendance";
import { OrnateCard } from "@/components/ui/premium-components";
import { Trash2, Eye, Calendar, Users, AlertCircle } from "lucide-react";
import toast from "react-hot-toast";
import Link from "next/link";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export function MasterAttendanceList({ initialEvents }: { initialEvents: any[] }) {
    const [events, setEvents] = useState(initialEvents);
    const [deleteId, setDeleteId] = useState<string | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const router = useRouter();

    const handleDelete = async () => {
        if (!deleteId) return;
        setIsDeleting(true);

        const result = await deleteMasterEvent(deleteId);

        if (result.success) {
            toast.success("Event and records deleted permanently");
            setEvents(prev => prev.filter(e => e.id !== deleteId));
            router.refresh();
        } else {
            toast.error(result.error || "Failed to delete event");
        }

        setIsDeleting(false);
        setDeleteId(null);
    };

    if (events.length === 0) {
        return (
            <OrnateCard className="p-12 text-center text-neutral-500">
                <Calendar className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No attendance events found.</p>
            </OrnateCard>
        );
    }

    return (
        <>
            <OrnateCard className="p-0 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-gold/10 border-b border-gold/20 text-primary-dark">
                                <th className="p-4 font-bold font-serif whitespace-nowrap">Event Name</th>
                                <th className="p-4 font-bold font-serif whitespace-nowrap">Date & Time</th>
                                <th className="p-4 font-bold font-serif whitespace-nowrap text-center">Attendees</th>
                                <th className="p-4 font-bold font-serif whitespace-nowrap text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-neutral-100">
                            {events.map((event) => (
                                <tr key={event.id} className="hover:bg-neutral-50 transition-colors">
                                    <td className="p-4">
                                        <div className="font-bold text-neutral-800">{event.name}</div>
                                        {event.isActive && (
                                            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 bg-emerald-100 px-2 py-0.5 rounded-full mt-1 inline-block">ID: Active Session</span>
                                        )}
                                    </td>
                                    <td className="p-4 text-sm text-neutral-600">
                                        <div className="flex items-center gap-2">
                                            <Calendar className="w-4 h-4 text-gold" />
                                            {format(new Date(event.date), "EEE, MMM d, yyyy")}
                                        </div>
                                    </td>
                                    <td className="p-4 text-center">
                                        <div className="inline-flex items-center gap-2 px-3 py-1 bg-neutral-100 rounded-full text-sm font-bold text-neutral-700">
                                            <Users className="w-4 h-4" />
                                            {event.attendeeCount}
                                        </div>
                                    </td>
                                    <td className="p-4 text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            <Link href={`/admin/attendance-details/${event.id}`}>
                                                <button className="p-2 text-neutral-500 hover:text-primary hover:bg-primary/5 rounded-lg transition-colors" title="View Details">
                                                    <Eye className="w-5 h-5" />
                                                </button>
                                            </Link>
                                            <button
                                                onClick={() => setDeleteId(event.id)}
                                                className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                title="Delete Event"
                                            >
                                                <Trash2 className="w-5 h-5" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </OrnateCard>

            <AlertDialog open={!!deleteId} onOpenChange={(open: boolean) => !open && setDeleteId(null)}>
                <AlertDialogContent className="bg-white border-gold/20">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="text-red-600 flex items-center gap-2">
                            <AlertCircle className="w-5 h-5" />
                            Delete Verification
                        </AlertDialogTitle>
                        <AlertDialogDescription className="space-y-3">
                            <p>Are you sure you want to delete this event?</p>
                            <div className="bg-red-50 p-3 rounded-lg text-sm text-red-800 border border-red-100">
                                <strong>Warning:</strong> This action is <u>irreversible</u>. It will permanently delete:
                                <ul className="list-disc pl-5 mt-1 space-y-1">
                                    <li>The Event itself</li>
                                    <li>Attendance Session config</li>
                                    <li><strong>ALL Attendance Records</strong> for all users for this event</li>
                                </ul>
                            </div>
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={(e) => { e.preventDefault(); handleDelete(); }}
                            className="bg-red-600 hover:bg-red-700 text-white"
                            disabled={isDeleting}
                        >
                            {isDeleting ? "Deleting..." : "Permanently Delete"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}
