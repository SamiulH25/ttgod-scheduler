import { differenceInCalendarWeeks } from "date-fns";

/** Stored JSON on `AvailabilityBlock.recurrenceRule` for weekly patterns. */
export type WeeklyRecurrenceRule = {
  type: "weekly";
  /** Repeat every N weeks (default 1). */
  interval?: number;
  /**
   * Which weekdays to emit, using UTC weekday: 0 = Sunday … 6 = Saturday
   * (same as `Date.prototype.getUTCDay()`).
   */
  weekdays?: number[];
};

export type ParsedRecurrenceRule = WeeklyRecurrenceRule;

export type ExpandedOccurrence = {
  start: Date;
  end: Date;
  /** Series id from the source block when present. */
  seriesId: string | null;
};

function isValidWeekday(n: number): boolean {
  return Number.isInteger(n) && n >= 0 && n <= 6;
}

export function utcStartOfDay(d: Date): Date {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
}

export function addUtcDays(d: Date, days: number): Date {
  const t = new Date(d.getTime());
  t.setUTCDate(t.getUTCDate() + days);
  return t;
}

/** Monday 00:00 UTC of the ISO week containing `d` (weekStartsOn: Monday). */
export function utcStartOfIsoWeek(d: Date): Date {
  const day = utcStartOfDay(d);
  const dow = day.getUTCDay(); // 0 Sun … 6 Sat
  const mondayOffset = dow === 0 ? -6 : 1 - dow;
  return addUtcDays(day, mondayOffset);
}

/** Parse and validate `recurrenceRule` JSON. Returns null when absent or invalid. */
export function parseRecurrenceRule(
  recurrenceRule: string | null | undefined,
): ParsedRecurrenceRule | null {
  if (recurrenceRule == null || recurrenceRule.trim() === "") return null;
  try {
    const raw = JSON.parse(recurrenceRule) as unknown;
    if (!raw || typeof raw !== "object") return null;
    const obj = raw as Record<string, unknown>;
    if (obj.type !== "weekly") return null;
    const interval =
      obj.interval === undefined
        ? 1
        : typeof obj.interval === "number" && obj.interval >= 1 && obj.interval <= 52
          ? Math.floor(obj.interval)
          : null;
    if (interval == null) return null;
    let weekdays: number[] | undefined;
    if (obj.weekdays !== undefined) {
      if (!Array.isArray(obj.weekdays) || obj.weekdays.length === 0) return null;
      weekdays = [];
      for (const w of obj.weekdays) {
        if (typeof w !== "number" || !isValidWeekday(w)) return null;
        weekdays.push(w);
      }
    }
    return { type: "weekly", interval, weekdays };
  } catch {
    return null;
  }
}

function durationMs(start: Date, end: Date): number {
  return end.getTime() - start.getTime();
}

/**
 * Expands a single availability block across `rangeFrom`–`rangeTo` when it carries
 * a weekly `recurrenceRule`. Non-recurring blocks return one occurrence clipped to the range.
 * Overlaps with `seriesId` from the anchor row when provided.
 */
export function expandWeeklyOccurrencesInRange(
  block: {
    start: Date;
    end: Date;
    recurrenceRule: string | null | undefined;
    seriesId?: string | null;
  },
  rangeFrom: Date,
  rangeTo: Date,
): ExpandedOccurrence[] {
  const dur = durationMs(block.start, block.end);
  if (dur <= 0) return [];

  const rule = parseRecurrenceRule(block.recurrenceRule);
  const seriesId = block.seriesId ?? null;

  if (!rule) {
    if (block.end <= rangeFrom || block.start >= rangeTo) return [];
    return [
      {
        start: block.start < rangeFrom ? new Date(rangeFrom) : block.start,
        end: block.end > rangeTo ? new Date(rangeTo) : block.end,
        seriesId,
      },
    ];
  }

  const interval = rule.interval ?? 1;
  const weekdays =
    rule.weekdays && rule.weekdays.length > 0
      ? [...new Set(rule.weekdays)].sort((a, b) => a - b)
      : [block.start.getUTCDay()];

  const anchorWeek = utcStartOfIsoWeek(block.start);
  const out: ExpandedOccurrence[] = [];

  let day = utcStartOfDay(rangeFrom);
  const endDay = utcStartOfDay(rangeTo);

  while (day <= endDay) {
    const dow = day.getUTCDay();
    if (!weekdays.includes(dow)) {
      day = addUtcDays(day, 1);
      continue;
    }

    const weekDiff = differenceInCalendarWeeks(utcStartOfIsoWeek(day), anchorWeek, {
      weekStartsOn: 1,
    });
    if (weekDiff < 0 || weekDiff % interval !== 0) {
      day = addUtcDays(day, 1);
      continue;
    }

    const occurrenceStart = new Date(day);
    occurrenceStart.setUTCHours(
      block.start.getUTCHours(),
      block.start.getUTCMinutes(),
      block.start.getUTCSeconds(),
      block.start.getUTCMilliseconds(),
    );
    const occurrenceEnd = new Date(occurrenceStart.getTime() + dur);

    if (occurrenceEnd > rangeFrom && occurrenceStart < rangeTo) {
      out.push({
        start: occurrenceStart < rangeFrom ? new Date(rangeFrom) : occurrenceStart,
        end: occurrenceEnd > rangeTo ? new Date(rangeTo) : occurrenceEnd,
        seriesId,
      });
    }

    day = addUtcDays(day, 1);
  }

  return out.sort((a, b) => a.start.getTime() - b.start.getTime());
}

/** Shift a block (or expanded window) by whole weeks so its start lands in the target week. */
export function shiftBlockToWeek(
  start: Date,
  end: Date,
  sourceWeekStart: Date,
  targetWeekStart: Date,
): { start: Date; end: Date } {
  const weeks = differenceInCalendarWeeks(
    utcStartOfIsoWeek(targetWeekStart),
    utcStartOfIsoWeek(sourceWeekStart),
    { weekStartsOn: 1 },
  );
  const ms = weeks * 7 * 24 * 60 * 60 * 1000;
  return {
    start: new Date(start.getTime() + ms),
    end: new Date(end.getTime() + ms),
  };
}
