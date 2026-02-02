import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function slugify(text: string): string {
  if (!text) return "";
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "") // Remove non-word chars
    .replace(/[\s_-]+/g, "-") // Replace spaces and underscores with hyphens
    .replace(/^-+|-+$/g, ""); // Remove leading/trailing hyphens
}

export function getHallModuleId(hallName: string): string {
  return `hall-${slugify(hallName)}`;
}

import { formatInTimeZone, fromZonedTime } from "date-fns-tz";

export function getTodayRangeIST() {
  const timeZone = "Asia/Kolkata";
  const todayIstString = formatInTimeZone(new Date(), timeZone, "yyyy-MM-dd");
  return {
    start: fromZonedTime(`${todayIstString} 00:00:00`, timeZone),
    end: fromZonedTime(`${todayIstString} 23:59:59.999`, timeZone),
  };
}
