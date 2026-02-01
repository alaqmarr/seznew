export interface MisriDate {
  day: number;
  month: number;
  year: number;
  monthName: string;
  monthNameEn: string;
  monthNameAr: string;
  dayAr: string;
  yearAr: string;
  formattedEn: string;
  formattedAr: string;
}

// In-memory cache for Hijri dates
const hijriCache = new Map<string, MisriDate>();

/**
 * Fetch Hijri date from API
 * @param date - JavaScript Date object
 * @returns Promise<MisriDate>
 */
export async function getMisriDate(date: Date): Promise<MisriDate> {
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
    );

    if (!response.ok) {
      throw new Error(`API returned ${response.status}`);
    }

    const data = await response.json();

    const misriDate: MisriDate = {
      day: data.day,
      month: data.month,
      year: data.year,
      monthName: data.monthNameEn,
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
    // Return fallback with proper Arabic fields
    return {
      day: date.getDate(),
      month: date.getMonth() + 1,
      year: 1447,
      monthName: "",
      monthNameEn: "",
      monthNameAr: "",
      dayAr: "",
      yearAr: "",
      formattedEn: "",
      formattedAr: "",
    };
  }
}

/**
 * Batch fetch Hijri dates for multiple dates
 */
export async function getMisriDatesForRange(
  dates: Date[],
): Promise<Map<string, MisriDate>> {
  const results = new Map<string, MisriDate>();

  const promises = dates.map(async (date) => {
    const hijri = await getMisriDate(date);
    const key = date.toISOString().split("T")[0];
    results.set(key, hijri);
  });

  await Promise.all(promises);
  return results;
}
