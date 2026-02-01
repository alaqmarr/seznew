export interface MisriDate {
  day: number;
  month: number;
  year: number;
  monthName: string; // Kept for backward compatibility (maps to monthNameEn)
  monthNameEn?: string;
  monthNameAr?: string;
  dayAr?: string;
  yearAr?: string;
  formattedEn: string;
  formattedAr: string;
}

// In-memory cache for Hijri dates to avoid redundant API calls
const hijriCache = new Map<string, MisriDate>();

/**
 * Fetch Hijri date from external API.
 * Uses IST date format (YYYY-MM-DD) for proper timezone handling.
 * @param date - JavaScript Date object
 * @returns Promise<MisriDate>
 */
export async function getMisriDate(date: Date): Promise<MisriDate> {
  // Format date as YYYY-MM-DD in IST
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const dateStr = `${year}-${month}-${day}`;

  // Check cache first
  if (hijriCache.has(dateStr)) {
    return hijriCache.get(dateStr)!;
  }

  try {
    const response = await fetch(
      `https://hijricalendar.alaqmar.dev/api/hijri?date=${dateStr}`,
      { cache: "no-store" },
    );

    if (!response.ok) {
      throw new Error(`API returned ${response.status}`);
    }

    const data = await response.json();

    // Map API response to MisriDate interface
    const misriDate: MisriDate = {
      day: data.day,
      month: data.month,
      year: data.year,
      monthName: data.monthNameEn, // Backward compatibility
      monthNameEn: data.monthNameEn,
      monthNameAr: data.monthNameAr,
      dayAr: data.dayAr,
      yearAr: data.yearAr,
      formattedEn: data.formattedEn,
      formattedAr: data.formattedAr,
    };

    // Store in cache
    hijriCache.set(dateStr, misriDate);

    return misriDate;
  } catch (error) {
    console.error(`Failed to fetch Hijri date for ${dateStr}:`, error);
    // Return fallback data on error
    return {
      day: date.getDate(),
      month: date.getMonth() + 1,
      year: 1447, // Approximate
      monthName: "Unknown",
      formattedEn: `${date.getDate()} Unknown`,
      formattedAr: `${date.getDate()}`,
    };
  }
}

/**
 * Batch fetch Hijri dates for multiple dates.
 * Useful for calendar views to load all dates at once.
 * @param dates - Array of Date objects
 * @returns Promise<Map<string, MisriDate>> - Map with date string keys
 */
export async function getMisriDatesForRange(
  dates: Date[],
): Promise<Map<string, MisriDate>> {
  const results = new Map<string, MisriDate>();

  // Fetch all dates in parallel
  const promises = dates.map(async (date) => {
    const hijri = await getMisriDate(date);
    const key = date.toISOString().split("T")[0];
    results.set(key, hijri);
  });

  await Promise.all(promises);
  return results;
}
