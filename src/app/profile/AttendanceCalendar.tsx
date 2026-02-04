"use client";

import { useState, useEffect } from "react";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { getMisriDate, MisriDate } from "@/lib/misri-calendar";
import { startOfMonth, endOfMonth, eachDayOfInterval } from "date-fns";

interface AttendanceEvent {
    eventId: string;
    eventName: string;
    date: Date;
    status: "PRESENT" | "ABSENT";
}

interface AttendanceCalendarProps {
    history: AttendanceEvent[];
}

export function AttendanceCalendar({ history }: AttendanceCalendarProps) {
    const presentDates = history
        .filter((h) => h.status === "PRESENT")
        .map((h) => new Date(h.date));

    const absentDates = history
        .filter((h) => h.status === "ABSENT")
        .map((h) => new Date(h.date));

    // State for managing view month and Hijri dates
    const [month, setMonth] = useState<Date>(new Date());
    const [hijriDates, setHijriDates] = useState<Record<string, MisriDate>>({});

    useEffect(() => {
        let ismounted = true;
        const fetchHijriDates = async () => {
            const start = startOfMonth(month);
            const end = endOfMonth(month);
            // Get days including some padding if needed, but react-day-picker creates days dynamically. 
            // We'll fetch for the visible month.
            const days = eachDayOfInterval({ start, end });

            const newDates: Record<string, MisriDate> = {};

            await Promise.all(
                days.map(async (day) => {
                    const key = day.toDateString();
                    // Avoid refetching if we already have it (optional optimization)
                    if (!hijriDates[key]) {
                        try {
                            const data = await getMisriDate(day);
                            newDates[key] = data;
                        } catch (e) {
                            console.error(e);
                        }
                    }
                })
            );

            if (ismounted) {
                setHijriDates(prev => ({ ...prev, ...newDates }));
            }
        };

        fetchHijriDates();
        return () => { ismounted = false; };
    }, [month]);

    return (
        <div className="flex flex-col md:flex-row gap-8 items-start w-full">
            {/* Calendar Section */}
            <div className="flex-1 w-full flex justify-center">
                <Calendar
                    mode="multiple"
                    selected={presentDates}
                    month={month}
                    onMonthChange={setMonth}
                    className="p-4 w-full"
                    components={{
                        DayContent: ({ date }) => {
                            const hijri = hijriDates[date.toDateString()];
                            return (
                                <div className="flex flex-col items-center justify-center w-full h-full min-h-[50px] gap-0.5 z-10 relative">
                                    <span className="text-xl font-bold leading-none text-neutral-700">{date.getDate()}</span>
                                    <span className="text-[10px] uppercase font-bold text-gold/80 leading-none mt-1 min-h-[10px]">
                                        {hijri ? `${hijri.monthNameAr.substring(0, 3)} ${hijri.dayAr}` : ''}
                                    </span>
                                </div>
                            );
                        }
                    }}
                    classNames={{
                        months: "flex flex-col sm:flex-row w-full relative",
                        month: "space-y-6 w-full",
                        caption: "flex justify-center pt-2 relative items-center mb-8",
                        caption_label: "text-2xl font-bold text-primary-dark font-serif",
                        nav: "absolute inset-x-0 top-0 flex items-center justify-between px-2 w-full",
                        nav_button: "h-9 w-9 bg-white shadow-sm border border-gold/20 hover:bg-gold/10 rounded-full transition-all text-primary-dark z-20",
                        nav_button_previous: "static",
                        nav_button_next: "static",
                        table: "w-full border-collapse space-y-1",
                        head_row: "flex w-full mb-3",
                        head_cell: "text-primary-dark rounded-md flex-1 font-bold text-sm uppercase tracking-wider opacity-90",
                        row: "flex w-full mt-2 gap-1",
                        cell: "flex-1 relative p-0 text-center text-sm focus-within:relative focus-within:z-20",
                        day: "w-full aspect-square p-1 font-normal hover:bg-gold/5 rounded-xl transition-all flex flex-col items-center justify-center text-neutral-700 relative",
                        day_selected: "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground",
                        day_today: "bg-gold/10 border border-gold/30 text-primary-dark font-bold",
                        day_outside: "text-muted-foreground opacity-30",
                        day_disabled: "text-muted-foreground opacity-30",
                        day_range_middle: "aria-selected:bg-accent aria-selected:text-accent-foreground",
                        day_hidden: "invisible",
                    }}
                    modifiers={{
                        present: presentDates,
                        absent: absentDates,
                    }}
                    modifiersClassNames={{
                        present: "after:absolute after:inset-0 after:border-2 after:border-emerald-500 after:rounded-xl after:bg-emerald-500/10 after:content-[''] !text-emerald-800 font-bold",
                        absent: "after:absolute after:inset-0 after:border-2 after:border-red-500 after:rounded-xl after:bg-red-500/10 after:content-[''] !text-red-800 font-bold",
                    }}
                />
            </div>

            {/* Legend & Summary */}
            <div className="md:w-64 space-y-6 w-full">
                <div>
                    <h3 className="font-serif font-bold text-lg mb-4 text-primary-dark">Attendance Key</h3>
                    <div className="space-y-3">
                        <div className="flex items-center gap-3">
                            <div className="w-4 h-4 rounded bg-emerald-600 border border-emerald-700 shadow-sm" />
                            <span className="text-sm font-bold text-neutral-700">Present</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="w-4 h-4 rounded bg-red-600 border border-red-700 shadow-sm" />
                            <span className="text-sm font-bold text-neutral-700">Absent</span>
                        </div>
                    </div>
                </div>

                <div className="pt-6 border-t border-dashed border-gray-200">
                    <h3 className="font-serif font-bold text-lg mb-2 text-primary-dark">Recent History</h3>
                    <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                        {history.length === 0 && <p className="text-sm text-gray-400 italic">No attendance records found.</p>}
                        {history.slice(0, 10).map((record) => (
                            <div key={record.eventId} className="flex justify-between items-center text-sm p-3 rounded-lg bg-white border border-gold/10 shadow-sm hover:shadow-md transition-all">
                                <div className="flex flex-col">
                                    <span className="font-bold text-primary-dark">{record.eventName}</span>
                                    <span className="text-xs text-neutral-500 font-medium">{new Date(record.date).toLocaleDateString()}</span>
                                </div>
                                <span
                                    className={cn(
                                        "text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider shadow-sm",
                                        record.status === "PRESENT" ? "bg-emerald-600 text-white" : "bg-red-600 text-white"
                                    )}>
                                    {record.status}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
