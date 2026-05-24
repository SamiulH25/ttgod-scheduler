import { max as dfMax, min as dfMin } from "date-fns";
import { findFullRosterSlots } from "@/lib/scheduling/find-slots";

export type Interval = { start: Date; end: Date };

export type AvailabilitySlice = {
  userId: string;
  start: Date;
  end: Date;
  status: string;
};

function intersectTwo(a: Interval, b: Interval): Interval | null {
  const start = dfMax([a.start, b.start]);
  const end = dfMin([a.end, b.end]);
  if (end > start) return { start, end };
  return null;
}

/** Intersection of many half-open-style intervals (end > start). */
export function intersectAll(intervals: Interval[]): Interval | null {
  if (intervals.length === 0) return null;
  let cur: Interval = intervals[0]!;
  for (let i = 1; i < intervals.length; i++) {
    const next = intersectTwo(cur, intervals[i]!);
    if (!next) return null;
    cur = next;
  }
  return cur;
}

export type SuggestProposalsOptions = {
  /** Minimum overlap duration in minutes (default 30). */
  minDurationMinutes?: number;
  /** Max proposals to return (default 10). */
  limit?: number;
  /** When true, tentative blocks count like free. Default false. */
  includeTentative?: boolean;
};

/**
 * Sliding-window search for `durationMinutes` slots where every user in `userIds`
 * has at least one overlapping availability slice.
 */
export function suggestProposalSlots(
  userIds: string[],
  slices: AvailabilitySlice[],
  rangeStart: Date,
  rangeEnd: Date,
  durationMinutes: number,
  options?: SuggestProposalsOptions,
): Interval[] {
  return findFullRosterSlots(
    userIds,
    slices,
    rangeStart,
    rangeEnd,
    durationMinutes,
    options,
  ).map((s) => ({ start: s.start, end: s.end }));
}
