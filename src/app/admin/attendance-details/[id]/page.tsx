import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getEventAttendees } from "@/app/actions/attendance";
import { OrnateHeading, OrnateCard } from "@/components/ui/premium-components";
import { Calendar, Clock, MapPin, Users, CheckCircle2 } from "lucide-react";
import { format } from "date-fns";

export default async function AttendanceDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const session = await getServerSession(authOptions);
    if (!session?.user) redirect("/login");

    const { id } = await params;
    const result = await getEventAttendees(id);

    if (!result.success || !result.event || !result.attendees) {
        return (
            <div className="container mx-auto py-20 px-4 text-center">
                <h2 className="text-2xl font-bold text-red-600">Event Not Found</h2>
                <p className="text-neutral-500 mt-2">The requested event could not be found or has been deleted.</p>
            </div>
        );
    }

    const { event, attendees } = result;

    return (
        <div className="container mx-auto py-10 px-4 space-y-8 min-h-screen bg-background-light mt-12">
            <OrnateHeading
                title={event.name}
                subtitle="Event Details & Attendance List"
            />

            {/* Event Meta Card */}
            <OrnateCard className="p-6">
                <div className="flex flex-wrap gap-6 items-center text-neutral-700">
                    <div className="flex items-center gap-2">
                        <Calendar className="w-5 h-5 text-gold" />
                        <span className="font-bold">{format(new Date(event.occasionDate), "EEEE, MMMM d, yyyy")}</span>
                    </div>
                    <div className="h-4 w-px bg-neutral-200 hidden sm:block" />
                    <div className="flex items-center gap-2">
                        <Users className="w-5 h-5 text-primary" />
                        <span className="font-bold">{attendees.length} Present</span>
                    </div>
                </div>
                {event.description && (
                    <p className="mt-4 text-neutral-500 border-t border-neutral-100 pt-4 text-sm">{event.description}</p>
                )}
            </OrnateCard>

            {/* Attendees List */}
            <OrnateCard className="p-0 overflow-hidden">
                <div className="p-4 bg-gold/5 border-b border-gold/10 flex items-center justify-between">
                    <h3 className="font-serif font-bold text-primary-dark">Present Members</h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-neutral-50 text-neutral-500 text-xs uppercase tracking-wider">
                                <th className="p-3 font-semibold">Name</th>
                                <th className="p-3 font-semibold">ITS</th>
                                <th className="p-3 font-semibold">Floor</th>
                                <th className="p-3 font-semibold">Head</th>
                                <th className="p-3 font-semibold text-right">Time</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-neutral-100">
                            {attendees.map((a: any) => (
                                <tr key={a.id} className="hover:bg-neutral-50/50">
                                    <td className="p-3 font-medium text-neutral-800">{a.name}</td>
                                    <td className="p-3 text-sm font-mono text-neutral-600">{a.its}</td>
                                    <td className="p-3 text-sm text-neutral-600">
                                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-50 text-blue-700">
                                            {a.floor}
                                        </span>
                                    </td>
                                    <td className="p-3 text-sm text-neutral-500">{a.head}</td>
                                    <td className="p-3 text-right text-xs text-neutral-400">
                                        {format(new Date(a.markedAt), "h:mm a")}
                                    </td>
                                </tr>
                            ))}
                            {attendees.length === 0 && (
                                <tr>
                                    <td colSpan={5} className="p-8 text-center text-neutral-400 italic">
                                        No attendees marked present for this event.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </OrnateCard>
        </div>
    );
}
