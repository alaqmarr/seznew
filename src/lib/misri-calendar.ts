export interface MisriDate {
  day: number;
  month: number;
  year: number;
  monthName: string;
  formattedEn: string;
  formattedAr: string;
}

const BISMI_DAYS = [
  30,
  29,
  30,
  29,
  30,
  29,
  30,
  29,
  30,
  29,
  30,
  30, // Month 12 is 30 in leap year, handled in logic
];

const MONTH_NAMES = [
  "Moharram al-Haram",
  "Safar al-Muzaffar",
  "Rabi al-Awwal",
  "Rabi al-Akhar",
  "Jumada al-Ula",
  "Jumada al-Ukhra",
  "Rajab al-Asab",
  "Shaban al-Karim",
  "Ramadan al-Moazzam",
  "Shawwal al-Mukarram",
  "Zilqada al-Haram",
  "Zilhaj al-Haram",
];

const AR_MONTH_NAMES = [
  "محرم الحرام",
  "صفر المظفر",
  "ربيع الأول",
  "ربيع الآخر",
  "جمادى الأولى",
  "جمادى الأخرى",
  "رجب الأصب",
  "شعبان الكريم",
  "رمضان المعظم",
  "شوال المكرم",
  "ذو القعدة الحرام",
  "ذو الحجة الحرام",
];

// Epoch: 15 July 622 CE (Julian) = Friday.
// Tabular Islamic Calendar (Fatimid/Misri uses specific leap year pattern)
// Leap years in 30 year cycle: 2, 5, 8, 10, 13, 16, 19, 21, 24, 27, 29
// Reference: https://en.wikipedia.org/wiki/Tabular_Islamic_calendar (Fatimid/Ismaili version usually type II or similar)

// Helper to check leap year in Misri calendar (Fatimid usually follows the standard Kuwaiti algorithm or similar,
// but Bohra calendar has specific leap years: 2, 5, 8, 10, 13, 16, 19, 21, 24, 27, 29 is common).
function isLeapYear(year: number): boolean {
  const remainder = year % 30;
  return [2, 5, 8, 10, 13, 16, 19, 21, 24, 27, 29].includes(remainder);
}

function g2h(date: Date): MisriDate {
  let d = date.getDate();
  let m = date.getMonth();
  let y = date.getFullYear();

  const mPart = (m - 9) / 12;
  const yPart = y + mPart;

  // Approximate Hijri year to start calculation
  // H = 1.030684 * (G - 621.5643)
  // This is just an approximation, better to use Julian Day count for precision.
  // Simplifying using a library-free approach for standard Tabular.

  // Using Julian Day Number (JDN) conversion
  const a = Math.floor((14 - (m + 1)) / 12);
  const y_ = y + 4800 - a;
  const m_ = m + 1 + 12 * a - 3;
  const jdn =
    d +
    Math.floor((153 * m_ + 2) / 5) +
    365 * y_ +
    Math.floor(y_ / 4) -
    Math.floor(y_ / 100) +
    Math.floor(y_ / 400) -
    32045;

  // Epoch for Hijri (1 Muharram 1 AH) -> 16 July 622 CE (Julian) -> JDN 1948440 (Fatimid likely uses 16th July Friday or 15th Thursday depending on phase)
  // Common Fatimid Tabular often aligns such that 1 Muharram 1445 was 19 July 2023.
  // Let's calibrate.
  // 19 July 2023 JDN:
  // d=19, m=6 (July is 6 index? no 7th month, index 6). new Date(2023, 6, 19)
  // The JDN calc above:
  // m=6, y=2023. a=0. y_=6823. m_=9.
  // jdn = 19 + floor((153*9 + 2)/5) + 365*6823 + floor(6823/4) - floor(6823/100) + floor(6823/400) - 32045
  // jdn = 19 + 275 + 2490395 + 1705 - 68 + 17 - 32045 = 2460298.
  // Misri 1 Muharram 1445 was indeed around 18/19 July 2023.

  // Let's use the standard tabular algorithm relative to the Hijri Epoch.
  // Epoch JDN 1948440 (July 16, 622 CE) is standard arithmetic.

  const hijriEpoch = 1948440;
  // Automatic adjustment: +1 day offset as per user feedback (calendar was running one day behind)
  const daysSinceEpoch = jdn - hijriEpoch + 1;

  // 30 year cycle = 10631 days
  const cycles = Math.floor(daysSinceEpoch / 10631);
  const daysInCycle = daysSinceEpoch % 10631;

  let yearInCycle = Math.floor(daysInCycle / 354); // Approx
  // Adjust year search
  let daysPassed = 0;
  let hYear = 1 + cycles * 30;

  // Find accurate year in cycle
  for (let i = 1; i <= 30; i++) {
    const daysInYear = isLeapYear(i) ? 355 : 354;
    if (daysInCycle < daysPassed + daysInYear) {
      hYear += i - 1;
      daysPassed = daysInCycle - daysPassed; // remaining days
      break;
    }
    daysPassed += daysInYear;
  }

  // Find month
  let hMonth = 0;
  while (hMonth < 12) {
    let daysInMonth = BISMI_DAYS[hMonth];
    if (hMonth === 11 && isLeapYear(hYear % 30 || 30)) {
      // Check leap based on 30-year cycle position
      daysInMonth = 30;
    }
    if (daysPassed < daysInMonth) {
      break;
    }
    daysPassed -= daysInMonth;
    hMonth++;
  }

  const hDay = daysPassed + 1; // daysPassed is 0-indexed day of month

  // Correction for "Misri" specifics if needed.
  // Usually standard tabular matches well.

  return {
    day: hDay,
    month: hMonth + 1,
    year: hYear,
    monthName: MONTH_NAMES[hMonth],
    formattedEn: `${hDay} ${MONTH_NAMES[hMonth]} ${hYear} H`,
    formattedAr: `${convertToArabicNum(hDay)} ${AR_MONTH_NAMES[hMonth]} ${convertToArabicNum(hYear)} هـ`,
  };
}

function convertToArabicNum(num: number): string {
  const map = ["٠", "١", "٢", "٣", "٤", "٥", "٦", "٧", "٨", "٩"];
  return num
    .toString()
    .split("")
    .map((d) => map[parseInt(d)])
    .join("");
}

export function getMisriDate(date: Date): MisriDate {
  return g2h(date);
}
