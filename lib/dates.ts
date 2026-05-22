import {
  endOfWeek,
  format,
  parseISO,
  startOfWeek,
} from "date-fns";

export function defaultWeekRange(): { from: Date; to: Date } {
  const now = new Date();
  return {
    from: startOfWeek(now, { weekStartsOn: 1 }),
    to: endOfWeek(now, { weekStartsOn: 1 }),
  };
}

export function parseRangeParams(
  fromParam: string | null,
  toParam: string | null,
): { from: Date; to: Date } {
  if (fromParam && toParam) {
    return { from: parseISO(fromParam), to: parseISO(toParam) };
  }
  return defaultWeekRange();
}

export function formatDateTimeRange(start: Date, end: Date, timezone = "UTC"): string {
  const opts: Intl.DateTimeFormatOptions = {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: timezone,
  };
  const s = new Intl.DateTimeFormat(undefined, opts).format(start);
  const e = new Intl.DateTimeFormat(undefined, {
    timeStyle: "short",
    timeZone: timezone,
  }).format(end);
  return `${s} – ${e}`;
}

export function toLocalDatetimeInputValue(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

/** datetime-local value → ISO 8601 with offset (Zod isoDateTime) */
export function datetimeLocalToISO(local: string): string {
  return new Date(local).toISOString();
}

export function formatShort(date: Date): string {
  return format(date, "EEE, MMM d · HH:mm");
}
