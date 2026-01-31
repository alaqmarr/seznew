"use client";

import { useState, useEffect, useMemo } from "react";
import { getMisriDate, MisriDate } from "@/lib/misri-calendar";
import { cn } from "@/lib/utils";
import { addDays, format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay } from "date-fns";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface Event {
    id: string;
    name: string;
    occasionDay: string | null;
    description: string | null;
    occasionDate: Date;
    eventType: string;
}

interface CalendarDay {
    date: Date;
    hijri: MisriDate | null;
}

// Abbreviated weekday names for mobile
const WEEKDAYS_SHORT = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
const WEEKDAYS_FULL = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export function HijriCalendar({ events }: { events: Event[] }) {
    const [viewDate, setViewDate] = useState(new Date());
    const [calendarDays, setCalendarDays] = useState<CalendarDay[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);

    // Calculate days in view month
    const monthDays = useMemo(() => {
        const start = startOfMonth(viewDate);
        const end = endOfMonth(viewDate);
        return eachDayOfInterval({ start, end });
    }, [viewDate]);

    // Fetch Hijri dates for all days in the month
    useEffect(() => {
        setIsLoading(true);
        const fetchHijriDates = async () => {
            const daysWithHijri: CalendarDay[] = await Promise.all(
                monthDays.map(async (day) => ({
                    date: day,
                    hijri: await getMisriDate(day),
                }))
            );
            setCalendarDays(daysWithHijri);
            setIsLoading(false);
        };
        fetchHijriDates();
    }, [monthDays]);

    const handlePrevMonth = () => setViewDate(prev => addDays(startOfMonth(prev), -1));
    const handleNextMonth = () => setViewDate(prev => addDays(endOfMonth(prev), 1));

    // Get start day padding
    const startPadding = startOfMonth(viewDate).getDay();

    return (
        <div className="w-full max-w-4xl mx-auto bg-white rounded-xl shadow-sm border border-neutral-mid/20 overflow-hidden">
            {/* Header */}
            <div className="p-3 md:p-4 flex items-center justify-between bg-background-light border-b border-neutral-mid/10">
                <button
                    onClick={handlePrevMonth}
                    className="p-1.5 md:p-2 hover:bg-neutral-mid/10 rounded-full active:scale-95 transition-transform"
                >
                    <ChevronLeft className="w-4 h-4 md:w-5 md:h-5 text-neutral-dark" />
                </button>
                <h2 className="text-sm md:text-lg font-bold font-serif text-neutral-dark">
                    {format(viewDate, "MMMM yyyy")}
                </h2>
                <button
                    onClick={handleNextMonth}
                    className="p-1.5 md:p-2 hover:bg-neutral-mid/10 rounded-full active:scale-95 transition-transform"
                >
                    <ChevronRight className="w-4 h-4 md:w-5 md:h-5 text-neutral-dark" />
                </button>
            </div>

            {/* Weekday Headers */}
            <div className="grid grid-cols-7 border-b border-neutral-mid/10 bg-neutral-50">
                {WEEKDAYS_FULL.map((day, i) => (
                    <div key={day} className="py-1.5 md:py-2 text-center text-[10px] md:text-xs font-semibold text-neutral-mid uppercase tracking-wider">
                        <span className="hidden md:inline">{day}</span>
                        <span className="md:hidden">{WEEKDAYS_SHORT[i]}</span>
                    </div>
                ))}
            </div>

            {/* Calendar Grid */}
            <div className="grid grid-cols-7 divide-x divide-y divide-neutral-mid/10 relative">
                {/* Loading Overlay */}
                {isLoading && (
                    <div className="absolute inset-0 bg-white/80 flex items-center justify-center z-10">
                        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                    </div>
                )}

                {/* Start padding cells */}
                {Array.from({ length: startPadding }).map((_, i) => (
                    <div key={`empty-${i}`} className="h-12 md:h-20 lg:h-28 bg-neutral-50/50" />
                ))}

                {/* Day cells */}
                {calendarDays.map(({ date, hijri }) => {
                    const dayEvents = events.filter(e => isSameDay(new Date(e.occasionDate), date));
                    const isToday = isSameDay(date, new Date());
                    const hasEvents = dayEvents.length > 0;

                    return (
                        <div
                            key={date.toISOString()}
                            className={cn(
                                "h-12 md:h-20 lg:h-28 p-0.5 md:p-1.5 flex flex-col relative group",
                                "hover:bg-background-light/30 transition-colors cursor-pointer",
                                isToday && "bg-primary/5",
                                hasEvents && "bg-gold/5"
                            )}
                            onClick={() => hasEvents && setSelectedEvent(dayEvents[0])}
                        >
                            {/* Date Numbers */}
                            <div className="flex justify-between items-start gap-0.5">
                                <span className={cn(
                                    "text-[10px] md:text-sm font-medium",
                                    "w-4 h-4 md:w-6 md:h-6 flex items-center justify-center rounded-full",
                                    isToday ? "bg-primary text-white" : "text-neutral-dark"
                                )}>
                                    {date.getDate()}
                                </span>
                                {hijri && (
                                    <div className="text-right leading-none">
                                        <span className="block text-[8px] md:text-xs font-arabic text-primary">
                                            {hijri.dayAr || hijri.formattedAr.split(' ')[0]}
                                        </span>
                                        <span className="hidden md:block text-[8px] lg:text-[10px] text-neutral-mid truncate max-w-[60px]">
                                            {hijri.monthName}
                                        </span>
                                    </div>
                                )}
                            </div>

                            {/* Events - Mobile: dots, Desktop: text */}
                            {hasEvents && (
                                <>
                                    {/* Mobile: Event dots */}
                                    <div className="md:hidden mt-auto flex justify-center gap-0.5 pb-0.5">
                                        {dayEvents.slice(0, 3).map((_, i) => (
                                            <div
                                                key={i}
                                                className="w-1.5 h-1.5 rounded-full bg-primary"
                                            />
                                        ))}
                                        {dayEvents.length > 3 && (
                                            <span className="text-[8px] text-primary">+{dayEvents.length - 3}</span>
                                        )}
                                    </div>

                                    {/* Desktop: Event text */}
                                    <div className="hidden md:block mt-1 space-y-0.5 overflow-y-auto scrollbar-hide flex-1">
                                        {dayEvents.slice(0, 2).map(event => (
                                            <div
                                                key={event.id}
                                                className="text-[10px] lg:text-xs bg-primary/10 text-primary-dark px-1 py-0.5 rounded truncate"
                                                title={event.description || event.name}
                                            >
                                                {event.description || event.name}
                                            </div>
                                        ))}
                                        {dayEvents.length > 2 && (
                                            <span className="text-[10px] text-primary">+{dayEvents.length - 2} more</span>
                                        )}
                                    </div>
                                </>
                            )}
                        </div>
                    );
                })}
            </div>

            {/* Event Detail Popover (for mobile taps) */}
            {selectedEvent && (
                <div
                    className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 md:hidden"
                    onClick={() => setSelectedEvent(null)}
                >
                    <div
                        className="bg-white rounded-xl p-4 max-w-sm w-full shadow-xl"
                        onClick={e => e.stopPropagation()}
                    >
                        <h3 className="text-lg font-bold text-primary-dark mb-2">
                            {selectedEvent.description || selectedEvent.name}
                        </h3>
                        <p className="text-sm text-neutral-mid">
                            {format(new Date(selectedEvent.occasionDate), "EEEE, MMMM do, yyyy")}
                        </p>
                        {selectedEvent.occasionDay && (
                            <p className="text-sm text-gold font-medium mt-1">
                                {selectedEvent.occasionDay}
                            </p>
                        )}
                        <button
                            onClick={() => setSelectedEvent(null)}
                            className="mt-4 w-full py-2 bg-primary text-white rounded-lg font-medium"
                        >
                            Close
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
