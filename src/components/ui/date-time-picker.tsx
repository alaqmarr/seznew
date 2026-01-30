"use client"

import * as React from "react"
import { format, setHours, setMinutes, setSeconds } from "date-fns"
import { Calendar as CalendarIcon, Clock } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"
import { Input } from "@/components/ui/input"
interface DateTimePickerProps {
    date: Date | undefined
    setDate: (date: Date | undefined) => void
}

export function DateTimePicker({ date, setDate }: DateTimePickerProps) {
    const [selectedDate, setSelectedDate] = React.useState<Date | undefined>(date)

    // Update parent when either date or time changes
    const handleDateSelect = (newDate: Date | undefined) => {
        if (!newDate) return

        // If we already have a time set in the current date, preserve it
        const updatedDate = date
            ? new Date(
                newDate.getFullYear(),
                newDate.getMonth(),
                newDate.getDate(),
                date.getHours(),
                date.getMinutes(),
                date.getSeconds()
            )
            : newDate

        setSelectedDate(updatedDate)
        setDate(updatedDate)
    }

    const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const time = e.target.value // Format: "HH:mm"
        if (!time) return

        const [hours, minutes] = time.split(":").map(Number)
        const baseDate = selectedDate || new Date()

        const updatedDate = setSeconds(setMinutes(setHours(baseDate, hours), minutes), 0)

        setSelectedDate(updatedDate)
        setDate(updatedDate)
    }

    return (
        <div className="flex gap-2">
            {/* Date Picker */}
            <div className="flex-grow">
                <Popover>
                    <PopoverTrigger asChild>
                        <Button
                            variant={"outline"}
                            className={cn(
                                "w-full justify-start text-left font-normal border-neutral-200",
                                !date && "text-muted-foreground"
                            )}
                        >
                            <CalendarIcon className="mr-2 h-4 w-4 text-gold" />
                            {date ? format(date, "PPP") : <span>Pick a date</span>}
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                            mode="single"
                            selected={date}
                            onSelect={handleDateSelect}
                            initialFocus
                        />
                    </PopoverContent>
                </Popover>
            </div>

            {/* Time Picker */}
            <div className="w-[120px] relative">
                <Input
                    type="time"
                    onChange={handleTimeChange}
                    value={date ? format(date, "HH:mm") : ""}
                    className="bg-white border-neutral-200 focus:ring-gold/50 pr-2 block"
                />
            </div>
        </div>
    )
}