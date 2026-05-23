import { addDays, addHours, startOfDay } from "date-fns";

export type HeatmapBlockInput = {
  userId: string;
  start: Date;
  end: Date;
  status?: string | null;
};

/**
 * For each calendar day in the week (Mon-first) and each hour 0–23 local,
 * count distinct users with a **free** block overlapping that hour.
 */
export function buildSquadHeatmap(
  weekStart: Date,
  blocks: HeatmapBlockInput[],
): { dayIndex: number; hour: number; count: number }[] {
  const out: { dayIndex: number; hour: number; count: number }[] = [];
  for (let d = 0; d < 7; d++) {
    const day = addDays(weekStart, d);
    for (let h = 0; h < 24; h++) {
      const cellStart = addHours(startOfDay(day), h);
      const cellEnd = addHours(cellStart, 1);
      const userSet = new Set<string>();
      for (const b of blocks) {
        const st = (b.status ?? "free").toLowerCase();
        if (st !== "free") continue;
        if (b.start < cellEnd && b.end > cellStart) {
          userSet.add(b.userId);
        }
      }
      out.push({ dayIndex: d, hour: h, count: userSet.size });
    }
  }
  return out;
}
