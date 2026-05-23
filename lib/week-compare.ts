import { addDays } from "date-fns";

export type WeekCompareBlock = {
  userId: string;
  start: Date;
  end: Date;
  status?: string | null;
};

function blockInWeek(b: WeekCompareBlock, weekStart: Date, weekEnd: Date) {
  return b.start < weekEnd && b.end > weekStart;
}

function freeMinutesInWeek(
  userId: string,
  weekStart: Date,
  weekEnd: Date,
  blocks: WeekCompareBlock[],
): number {
  let total = 0;
  for (const b of blocks) {
    if (b.userId !== userId) continue;
    const st = (b.status ?? "free").toLowerCase();
    if (st !== "free") continue;
    if (!blockInWeek(b, weekStart, weekEnd)) continue;
    const s = Math.max(b.start.getTime(), weekStart.getTime());
    const e = Math.min(b.end.getTime(), weekEnd.getTime());
    if (e > s) total += (e - s) / 60000;
  }
  return Math.round(total);
}

export type WeekCompareResult = {
  weekAStart: string;
  weekBStart: string;
  perUser: {
    userId: string;
    freeMinutesA: number;
    freeMinutesB: number;
    deltaMinutes: number;
  }[];
};

/**
 * Compare total **free** coverage minutes per user between two ISO-week windows
 * (same length as a calendar week from each start).
 */
export function compareWeeksAvailability(params: {
  weekAStart: Date;
  weekBStart: Date;
  blocks: WeekCompareBlock[];
  userIds: string[];
}): WeekCompareResult {
  const weekAEnd = addDays(params.weekAStart, 7);
  const weekBEnd = addDays(params.weekBStart, 7);
  const perUser = params.userIds.map((userId) => {
    const freeMinutesA = freeMinutesInWeek(
      userId,
      params.weekAStart,
      weekAEnd,
      params.blocks,
    );
    const freeMinutesB = freeMinutesInWeek(
      userId,
      params.weekBStart,
      weekBEnd,
      params.blocks,
    );
    return {
      userId,
      freeMinutesA,
      freeMinutesB,
      deltaMinutes: freeMinutesB - freeMinutesA,
    };
  });
  return {
    weekAStart: params.weekAStart.toISOString(),
    weekBStart: params.weekBStart.toISOString(),
    perUser,
  };
}
