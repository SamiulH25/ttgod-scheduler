import { addMinutes, max as dfMax, min as dfMin } from "date-fns";

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
  const minDur = options?.minDurationMinutes ?? 30;
  const limit = options?.limit ?? 10;
  if (userIds.length === 0 || durationMinutes <= 0 || rangeEnd <= rangeStart) return [];

  const freeLike = (s: AvailabilitySlice) =>
    s.status === "free" || (options?.includeTentative === true && s.status === "tentative");

  const byUser = new Map<string, Interval[]>();
  for (const uid of userIds) {
    byUser.set(
      uid,
      slices
        .filter((s) => s.userId === uid && freeLike(s))
        .filter((s) => s.end > rangeStart && s.start < rangeEnd)
        .map((s) => ({
          start: dfMax([s.start, rangeStart]),
          end: dfMin([s.end, rangeEnd]),
        }))
        .filter((s) => s.end > s.start)
        .sort((a, b) => a.start.getTime() - b.start.getTime()),
    );
  }

  for (const uid of userIds) {
    if (!byUser.get(uid)?.length) return [];
  }

  const out: Interval[] = [];
  const stepMs = 15 * 60 * 1000;

  let t = rangeStart.getTime();
  const endT = rangeEnd.getTime() - durationMinutes * 60 * 1000;
  while (t <= endT && out.length < limit) {
    const winStart = new Date(t);
    const winEnd = addMinutes(winStart, durationMinutes);

    const perUser: Interval[] = [];
    let ok = true;
    for (const uid of userIds) {
      const blocks = byUser.get(uid) ?? [];
      const hit = blocks.find((b) => b.start < winEnd && b.end > winStart);
      if (!hit) {
        ok = false;
        break;
      }
      const clipped: Interval = {
        start: dfMax([hit.start, winStart]),
        end: dfMin([hit.end, winEnd]),
      };
      if (clipped.end <= clipped.start) {
        ok = false;
        break;
      }
      perUser.push(clipped);
    }

    if (ok) {
      const common = intersectAll(perUser);
      if (common && common.end.getTime() - common.start.getTime() >= minDur * 60 * 1000) {
        const last = out[out.length - 1];
        if (
          !last ||
          last.start.getTime() !== winStart.getTime() ||
          last.end.getTime() !== winEnd.getTime()
        ) {
          out.push({ start: winStart, end: winEnd });
        }
      }
    }

    t += stepMs;
  }

  return out;
}
