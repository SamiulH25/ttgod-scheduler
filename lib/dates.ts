import {
  endOfWeek,
  format,
  formatDistanceToNow,
  isFuture,
  isPast,
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

export function toLocalDatetimeInputValue(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function datetimeLocalToISO(local: string): string {
  return new Date(local).toISOString();
}

export function formatShort(date: Date): string {
  return format(date, "EEE, MMM d · HH:mm");
}

export function formatProposalRange(start: Date | string, end: Date | string): string {
  const startDate = start instanceof Date ? start : new Date(start);
  const endDate = end instanceof Date ? end : new Date(end);
  const sameDay =
    format(startDate, "yyyy-MM-dd") === format(endDate, "yyyy-MM-dd");
  if (sameDay) {
    return `${format(startDate, "EEE, MMM d")} · ${format(startDate, "HH:mm")} – ${format(endDate, "HH:mm")}`;
  }
  return `${format(startDate, "EEE, MMM d HH:mm")} → ${format(endDate, "EEE, MMM d HH:mm")}`;
}

export function formatEventWhen(
  phase: string,
  start: Date | string | null,
  end: Date | string | null,
  proposalCount = 0,
): string {
  if (phase === "interest") {
    return "Gathering interest";
  }
  if (phase === "scheduling") {
    if (proposalCount > 0) {
      return `Vote on ${proposalCount} time${proposalCount === 1 ? "" : "s"}`;
    }
    return "Pick a time — add slots";
  }
  if (!start || !end) {
    return "Scheduled time TBD";
  }
  const startDate = start instanceof Date ? start : new Date(start);
  const endDate = end instanceof Date ? end : new Date(end);
  if (isFuture(startDate)) {
    return `Starts ${formatDistanceToNow(startDate, { addSuffix: true })}`;
  }
  if (isPast(endDate)) {
    return `Ended ${formatDistanceToNow(endDate, { addSuffix: true })}`;
  }
  return `Now · until ${format(endDate, "HH:mm")}`;
}
