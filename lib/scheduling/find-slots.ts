import { addMinutes, format } from "date-fns";
import {
  intersectAll,
  type AvailabilitySlice,
  type Interval,
} from "@/lib/suggest-proposals";

export type RankedSlot = {
  start: Date;
  end: Date;
  overlapCount: number;
  userIds: string[];
  score: number;
  reasons: string[];
};

export type FindRankedSlotsOptions = {
  minDurationMinutes?: number;
  limit?: number;
  includeTentative?: boolean;
  /** Minimum users free in the window (default 2). */
  minOverlapCount?: number;
  /** When set, boost slots where all roster members are free. */
  rosterSize?: number;
  /** date YYYY-MM-DD -> max precip % that day (host weather); slots penalized if high. */
  precipByDate?: Record<string, number>;
};

const STEP_MS = 15 * 60 * 1000;

function freeLike(s: AvailabilitySlice, includeTentative: boolean): boolean {
  return (
    s.status === "free" || (includeTentative && s.status === "tentative")
  );
}

function buildUserIntervals(
  userIds: string[],
  slices: AvailabilitySlice[],
  rangeStart: Date,
  rangeEnd: Date,
  includeTentative: boolean,
): Map<string, Interval[]> {
  const byUser = new Map<string, Interval[]>();
  for (const uid of userIds) {
    byUser.set(
      uid,
      slices
        .filter((s) => s.userId === uid && freeLike(s, includeTentative))
        .filter((s) => s.end > rangeStart && s.start < rangeEnd)
        .map((s) => ({
          start: new Date(Math.max(s.start.getTime(), rangeStart.getTime())),
          end: new Date(Math.min(s.end.getTime(), rangeEnd.getTime())),
        }))
        .filter((s) => s.end > s.start),
    );
  }
  return byUser;
}

function usersFreeInWindow(
  byUser: Map<string, Interval[]>,
  userIds: string[],
  winStart: Date,
  winEnd: Date,
): string[] {
  const free: string[] = [];
  for (const uid of userIds) {
    const blocks = byUser.get(uid) ?? [];
    if (blocks.some((b) => b.start < winEnd && b.end > winStart)) {
      free.push(uid);
    }
  }
  return free;
}

function slotKey(start: Date, durationMinutes: number): string {
  return `${start.getTime()}-${durationMinutes}`;
}

function explainSlot(
  start: Date,
  end: Date,
  overlapCount: number,
  rosterSize: number,
  precipByDate?: Record<string, number>,
): string[] {
  const reasons: string[] = [];
  if (rosterSize > 0) {
    reasons.push(`${overlapCount} of ${rosterSize} free`);
    if (overlapCount === rosterSize) {
      reasons.push("Whole squad available");
    }
  } else {
    reasons.push(`${overlapCount} available`);
  }

  const hour = start.getHours();
  const day = start.getDay();
  if (day === 0 || day === 6) {
    reasons.push("Weekend");
  }
  if (hour >= 18 && hour < 22) {
    reasons.push("Evening");
  } else if (hour >= 9 && hour < 12) {
    reasons.push("Morning");
  }

  const dateKey = format(start, "yyyy-MM-dd");
  const precip = precipByDate?.[dateKey];
  if (precip != null && precip >= 50) {
    reasons.push("Rain likely");
  }

  const durationH = (end.getTime() - start.getTime()) / 3600000;
  if (durationH >= 2) {
    reasons.push(`${Math.round(durationH)}h window`);
  }

  return reasons.slice(0, 4);
}

function scoreSlot(
  overlapCount: number,
  rosterSize: number,
  start: Date,
  precipByDate?: Record<string, number>,
): number {
  let score = overlapCount * 10;
  if (rosterSize > 0 && overlapCount === rosterSize) {
    score += 25;
  } else if (rosterSize > 0) {
    score += Math.round((overlapCount / rosterSize) * 15);
  }

  const hour = start.getHours();
  if (hour >= 10 && hour <= 21) {
    score += 5;
  }

  const dateKey = format(start, "yyyy-MM-dd");
  const precip = precipByDate?.[dateKey];
  if (precip != null && precip >= 60) {
    score -= 15;
  } else if (precip != null && precip >= 30) {
    score -= 5;
  }

  return score;
}

/**
 * Find ranked time windows where multiple squad members overlap availability.
 * Unlike suggestProposalSlots, allows partial roster overlap (minOverlapCount).
 */
export function findRankedSlots(
  userIds: string[],
  slices: AvailabilitySlice[],
  rangeStart: Date,
  rangeEnd: Date,
  durationMinutes: number,
  options?: FindRankedSlotsOptions,
): RankedSlot[] {
  const minDur = options?.minDurationMinutes ?? 30;
  const limit = options?.limit ?? 12;
  const includeTentative = options?.includeTentative ?? false;
  const minOverlap = Math.max(
    2,
    options?.minOverlapCount ?? 2,
  );
  const rosterSize = options?.rosterSize ?? userIds.length;

  if (userIds.length === 0 || durationMinutes <= 0 || rangeEnd <= rangeStart) {
    return [];
  }

  const byUser = buildUserIntervals(
    userIds,
    slices,
    rangeStart,
    rangeEnd,
    includeTentative,
  );

  const candidates = new Map<string, RankedSlot>();
  const durationMs = durationMinutes * 60 * 1000;
  const minDurMs = minDur * 60 * 1000;

  let t = rangeStart.getTime();
  const endT = rangeEnd.getTime() - durationMs;

  while (t <= endT) {
    const winStart = new Date(t);
    const winEnd = addMinutes(winStart, durationMinutes);
    const freeUsers = usersFreeInWindow(byUser, userIds, winStart, winEnd);

    if (freeUsers.length >= minOverlap) {
      const perUserIntervals: Interval[] = [];
      let allClipOk = true;
      for (const uid of freeUsers) {
        const blocks = byUser.get(uid) ?? [];
        const hit = blocks.find((b) => b.start < winEnd && b.end > winStart);
        if (!hit) {
          allClipOk = false;
          break;
        }
        perUserIntervals.push({
          start: new Date(Math.max(hit.start.getTime(), winStart.getTime())),
          end: new Date(Math.min(hit.end.getTime(), winEnd.getTime())),
        });
      }

      if (allClipOk && perUserIntervals.length >= minOverlap) {
        const common = intersectAll(perUserIntervals);
        if (
          common &&
          common.end.getTime() - common.start.getTime() >= minDurMs
        ) {
          const key = slotKey(winStart, durationMinutes);
          const overlapCount = freeUsers.length;
          const score = scoreSlot(
            overlapCount,
            rosterSize,
            winStart,
            options?.precipByDate,
          );
          const reasons = explainSlot(
            winStart,
            winEnd,
            overlapCount,
            rosterSize,
            options?.precipByDate,
          );
          const existing = candidates.get(key);
          if (!existing || score > existing.score) {
            candidates.set(key, {
              start: winStart,
              end: winEnd,
              overlapCount,
              userIds: freeUsers,
              score,
              reasons,
            });
          }
        }
      }
    }

    t += STEP_MS;
  }

  return [...candidates.values()]
    .sort((a, b) => b.score - a.score || b.overlapCount - a.overlapCount)
    .slice(0, limit);
}

/** Full-roster slots only (scheduling poll suggestions). */
export function findFullRosterSlots(
  userIds: string[],
  slices: AvailabilitySlice[],
  rangeStart: Date,
  rangeEnd: Date,
  durationMinutes: number,
  options?: Omit<FindRankedSlotsOptions, "minOverlapCount">,
): RankedSlot[] {
  if (userIds.length === 0) return [];
  return findRankedSlots(userIds, slices, rangeStart, rangeEnd, durationMinutes, {
    ...options,
    minOverlapCount: userIds.length,
    rosterSize: userIds.length,
  });
}

export function serializeRankedSlot(slot: RankedSlot) {
  return {
    start: slot.start.toISOString(),
    end: slot.end.toISOString(),
    overlapCount: slot.overlapCount,
    userIds: slot.userIds,
    score: slot.score,
    reasons: slot.reasons,
  };
}
