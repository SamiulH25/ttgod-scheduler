import Holidays from "date-holidays";
import { format, startOfDay } from "date-fns";

export type CanadianHoliday = {
  dateKey: string;
  name: string;
};

let caHolidays: Holidays | null = null;

function getCaHolidays(): Holidays {
  if (!caHolidays) {
    caHolidays = new Holidays("CA");
  }
  return caHolidays;
}

/** Federal public holidays in an inclusive date range (local calendar dates). */
export function getCanadianHolidaysForRange(
  start: Date,
  end: Date,
): CanadianHoliday[] {
  const hd = getCaHolidays();
  const rangeStart = startOfDay(start).getTime();
  const rangeEnd = startOfDay(end).getTime();
  const seen = new Set<string>();
  const out: CanadianHoliday[] = [];

  for (let year = start.getFullYear(); year <= end.getFullYear(); year++) {
    const rows = hd.getHolidays(year) as {
      date: string;
      name: string;
      type?: string;
    }[];
    for (const row of rows) {
      if (row.type && row.type !== "public") continue;
      const day = startOfDay(new Date(row.date));
      const t = day.getTime();
      if (t < rangeStart || t > rangeEnd) continue;
      const dateKey = format(day, "yyyy-MM-dd");
      if (seen.has(dateKey)) continue;
      seen.add(dateKey);
      out.push({ dateKey, name: row.name });
    }
  }

  return out.sort((a, b) => a.dateKey.localeCompare(b.dateKey));
}

export function canadianHolidaysByDateKey(
  start: Date,
  end: Date,
): Record<string, string> {
  const map: Record<string, string> = {};
  for (const h of getCanadianHolidaysForRange(start, end)) {
    map[h.dateKey] = h.name;
  }
  return map;
}

export function getCanadianHolidayName(
  dateKey: string,
  start: Date,
  end: Date,
): string | undefined {
  return canadianHolidaysByDateKey(start, end)[dateKey];
}
