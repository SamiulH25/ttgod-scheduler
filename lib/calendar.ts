import {
  addDays,
  differenceInMinutes,
  endOfDay,
  format,
  startOfDay,
  startOfWeek,
} from "date-fns";

export const CALENDAR_START_HOUR = 6;
export const CALENDAR_END_HOUR = 23;
export const HOUR_HEIGHT_PX = 48;

export const CALENDAR_HOURS = Array.from(
  { length: CALENDAR_END_HOUR - CALENDAR_START_HOUR + 1 },
  (_, i) => CALENDAR_START_HOUR + i,
);

export function getWeekStart(date: Date): Date {
  return startOfWeek(date, { weekStartsOn: 1 });
}

export function getWeekDays(weekStart: Date): Date[] {
  return Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
}

export function getWeekEnd(weekStart: Date): Date {
  return addDays(weekStart, 7);
}

export type CalendarBlock = {
  id: string;
  start: string;
  end: string;
  label: string | null;
  userId: string;
  user: { id: string; name: string | null; image: string | null };
};

export function toCalendarBlocks(
  rows: Array<{
    id: string;
    start: Date;
    end: Date;
    label: string | null;
    userId: string;
    user: { id: string; name: string | null; image: string | null };
  }>,
): CalendarBlock[] {
  return rows.map((b) => ({
    id: b.id,
    start: b.start.toISOString(),
    end: b.end.toISOString(),
    label: b.label,
    userId: b.userId,
    user: b.user,
  }));
}

export type DayBlockSegment = {
  block: CalendarBlock;
  topPercent: number;
  heightPercent: number;
  startMin: number;
  endMin: number;
};

export type SoloRect = {
  block: CalendarBlock;
  startMin: number;
  endMin: number;
  topPercent: number;
  heightPercent: number;
};

export type OverlapBand = {
  startMin: number;
  endMin: number;
  userIds: string[];
  blocks: CalendarBlock[];
  topPercent: number;
  heightPercent: number;
};

export type DayLayout = {
  soloRects: SoloRect[];
  overlapBands: OverlapBand[];
};

function userIdsKey(ids: string[]): string {
  return [...ids].sort().join(",");
}

/** Split a day into solo per-user slices and multi-user overlap bands only. */
export function buildDayLayout(day: Date, blocks: CalendarBlock[]): DayLayout {
  const segments = getBlocksForDay(day, blocks);
  if (segments.length === 0) {
    return { soloRects: [], overlapBands: [] };
  }

  const boundaries = new Set<number>();
  for (const s of segments) {
    boundaries.add(s.startMin);
    boundaries.add(s.endMin);
  }
  const points = [...boundaries].sort((a, b) => a - b);

  type SoloSlice = { block: CalendarBlock; startMin: number; endMin: number };
  type OverlapSlice = {
    startMin: number;
    endMin: number;
    userIds: string[];
    blocks: CalendarBlock[];
  };

  const soloSlices: SoloSlice[] = [];
  const overlapSlices: OverlapSlice[] = [];

  for (let i = 0; i < points.length - 1; i++) {
    const t0 = points[i]!;
    const t1 = points[i + 1]!;
    if (t1 <= t0) continue;

    const active = segments.filter((s) => s.startMin < t1 && s.endMin > t0);
    if (active.length === 0) continue;

    const userIds = [...new Set(active.map((s) => s.block.userId))];

    if (userIds.length >= 2) {
      const blockMap = new Map<string, CalendarBlock>();
      for (const s of active) blockMap.set(s.block.id, s.block);
      overlapSlices.push({
        startMin: t0,
        endMin: t1,
        userIds,
        blocks: [...blockMap.values()],
      });
    } else {
      soloSlices.push({ block: active[0]!.block, startMin: t0, endMin: t1 });
    }
  }

  soloSlices.sort(
    (a, b) => a.startMin - b.startMin || a.block.id.localeCompare(b.block.id),
  );
  const mergedSolo: SoloSlice[] = [];
  for (const slice of soloSlices) {
    const last = mergedSolo[mergedSolo.length - 1];
    if (last && last.block.id === slice.block.id && last.endMin === slice.startMin) {
      last.endMin = slice.endMin;
    } else {
      mergedSolo.push({ ...slice });
    }
  }

  overlapSlices.sort((a, b) => a.startMin - b.startMin);
  const mergedOverlap: OverlapSlice[] = [];
  for (const slice of overlapSlices) {
    const last = mergedOverlap[mergedOverlap.length - 1];
    if (
      last &&
      userIdsKey(last.userIds) === userIdsKey(slice.userIds) &&
      last.endMin === slice.startMin
    ) {
      last.endMin = slice.endMin;
      const blockMap = new Map(last.blocks.map((b) => [b.id, b]));
      for (const b of slice.blocks) blockMap.set(b.id, b);
      last.blocks = [...blockMap.values()];
    } else {
      mergedOverlap.push({
        startMin: slice.startMin,
        endMin: slice.endMin,
        userIds: slice.userIds,
        blocks: [...slice.blocks],
      });
    }
  }

  return {
    soloRects: mergedSolo.map((s) => ({
      block: s.block,
      startMin: s.startMin,
      endMin: s.endMin,
      topPercent: minutesToTopPercent(s.startMin),
      heightPercent: minutesToHeightPercent(s.startMin, s.endMin),
    })),
    overlapBands: mergedOverlap.map((o) => ({
      startMin: o.startMin,
      endMin: o.endMin,
      userIds: o.userIds,
      blocks: o.blocks,
      topPercent: minutesToTopPercent(o.startMin),
      heightPercent: minutesToHeightPercent(o.startMin, o.endMin),
    })),
  };
}

export function getBlocksForDay(day: Date, blocks: CalendarBlock[]): DayBlockSegment[] {
  const dayStart = startOfDay(day);
  const dayEnd = endOfDay(day);
  const dayMinutes = 24 * 60;

  const segments: DayBlockSegment[] = [];

  for (const block of blocks) {
    const start = new Date(block.start);
    const end = new Date(block.end);

    if (end <= dayStart || start >= dayEnd) {
      continue;
    }

    const segStart = start < dayStart ? dayStart : start;
    const segEnd = end > dayEnd ? dayEnd : end;

    const startMinutes = segStart.getHours() * 60 + segStart.getMinutes();
    const endMinutes = segEnd.getHours() * 60 + segEnd.getMinutes();
    const duration = Math.max(endMinutes - startMinutes, 15);

    segments.push({
      block,
      topPercent: (startMinutes / dayMinutes) * 100,
      heightPercent: (duration / dayMinutes) * 100,
      startMin: startMinutes,
      endMin: endMinutes,
    });
  }

  return segments;
}

export const DAY_MINUTES = 24 * 60;
export const SNAP_MINUTES = 15;
export const MIN_DRAG_MINUTES = 30;

/** Pixels per hour in the week grid (taller = easier to read). */
export const CALENDAR_PX_PER_HOUR = 72;

export type CalendarViewPeriod = "full" | "am" | "pm";

export type CalendarViewport = {
  period: CalendarViewPeriod;
  startMin: number;
  endMin: number;
  heightPx: number;
  durationMin: number;
};

const AM_END_MIN = 12 * 60;

export function getCalendarViewport(period: CalendarViewPeriod): CalendarViewport {
  if (period === "am") {
    return {
      period,
      startMin: 0,
      endMin: AM_END_MIN,
      heightPx: 12 * CALENDAR_PX_PER_HOUR,
      durationMin: AM_END_MIN,
    };
  }
  if (period === "pm") {
    return {
      period,
      startMin: AM_END_MIN,
      endMin: DAY_MINUTES,
      heightPx: 12 * CALENDAR_PX_PER_HOUR,
      durationMin: DAY_MINUTES - AM_END_MIN,
    };
  }
  return {
    period,
    startMin: 0,
    endMin: DAY_MINUTES,
    heightPx: 24 * CALENDAR_PX_PER_HOUR,
    durationMin: DAY_MINUTES,
  };
}

export function getViewportHours(viewport: CalendarViewport): number[] {
  const startHour = Math.floor(viewport.startMin / 60);
  const endHour = Math.ceil(viewport.endMin / 60);
  return Array.from({ length: endHour - startHour }, (_, i) => startHour + i);
}

export function clipIntervalToViewport(
  startMin: number,
  endMin: number,
  viewport: CalendarViewport,
): { startMin: number; endMin: number; topPercent: number; heightPercent: number } | null {
  const s = Math.max(startMin, viewport.startMin);
  const e = Math.min(endMin, viewport.endMin);
  if (e <= s) return null;
  return {
    startMin: s,
    endMin: e,
    topPercent: ((s - viewport.startMin) / viewport.durationMin) * 100,
    heightPercent: ((e - s) / viewport.durationMin) * 100,
  };
}

export function yToMinutesInViewport(
  offsetY: number,
  containerHeight: number,
  viewport: CalendarViewport,
): number {
  const ratio = Math.max(0, Math.min(1, offsetY / containerHeight));
  const minutes = viewport.startMin + ratio * viewport.durationMin;
  const snapped = Math.round(minutes / SNAP_MINUTES) * SNAP_MINUTES;
  return Math.min(
    Math.max(snapped, viewport.startMin),
    viewport.endMin - SNAP_MINUTES,
  );
}

export function slotFromDayDragInViewport(
  day: Date,
  startY: number,
  endY: number,
  containerHeight: number,
  viewport: CalendarViewport,
): { start: Date; end: Date } {
  const a = yToMinutesInViewport(Math.min(startY, endY), containerHeight, viewport);
  const b = yToMinutesInViewport(Math.max(startY, endY), containerHeight, viewport);
  let startMin = a;
  let endMin = Math.max(b, a + MIN_DRAG_MINUTES);
  if (endMin > viewport.endMin) {
    endMin = viewport.endMin;
    startMin = Math.max(viewport.startMin, endMin - MIN_DRAG_MINUTES);
  }
  return {
    start: minutesToDate(day, startMin),
    end: minutesToDate(day, endMin),
  };
}

export function slotFromDayClickInViewport(
  day: Date,
  offsetY: number,
  containerHeight: number,
  viewport: CalendarViewport,
): { start: Date; end: Date } {
  const startMin = yToMinutesInViewport(offsetY, containerHeight, viewport);
  const endMin = Math.min(startMin + 120, viewport.endMin);
  return {
    start: minutesToDate(day, startMin),
    end: minutesToDate(day, endMin),
  };
}

export function formatHourLabel(hour: number): string {
  return `${String(hour).padStart(2, "0")}:00`;
}

export function formatTime24(date: Date): string {
  return format(date, "HH:mm");
}

export function yToMinutes(offsetY: number, containerHeight: number): number {
  const ratio = Math.max(0, Math.min(1, offsetY / containerHeight));
  const minutes = Math.round((ratio * DAY_MINUTES) / SNAP_MINUTES) * SNAP_MINUTES;
  return Math.min(minutes, DAY_MINUTES - SNAP_MINUTES);
}

export function minutesToDate(day: Date, minutes: number): Date {
  const d = startOfDay(day);
  d.setMinutes(minutes);
  return d;
}

export function slotFromDayDrag(
  day: Date,
  startY: number,
  endY: number,
  containerHeight: number,
): { start: Date; end: Date } {
  const a = yToMinutes(Math.min(startY, endY), containerHeight);
  const b = yToMinutes(Math.max(startY, endY), containerHeight);
  let startMin = a;
  let endMin = Math.max(b, a + MIN_DRAG_MINUTES);
  if (endMin > DAY_MINUTES) {
    endMin = DAY_MINUTES;
    startMin = Math.max(0, endMin - MIN_DRAG_MINUTES);
  }
  return {
    start: minutesToDate(day, startMin),
    end: minutesToDate(day, endMin),
  };
}

export function slotFromDayClick(
  day: Date,
  offsetY: number,
  containerHeight: number,
): { start: Date; end: Date } {
  const startMin = yToMinutes(offsetY, containerHeight);
  const endMin = Math.min(startMin + 120, DAY_MINUTES);
  return {
    start: minutesToDate(day, startMin),
    end: minutesToDate(day, endMin),
  };
}

export function minutesToTopPercent(minutes: number): number {
  return (minutes / DAY_MINUTES) * 100;
}

export function minutesToHeightPercent(startMin: number, endMin: number): number {
  return ((endMin - startMin) / DAY_MINUTES) * 100;
}

/** Visual density tier from percent height of the day column (accurate, no min-height inflate). */
export type BlockVisualTier = "micro" | "compact" | "full";

export function blockVisualTier(heightPercent: number): BlockVisualTier {
  if (heightPercent < 1.2) return "micro";
  if (heightPercent < 2.8) return "compact";
  return "full";
}

/** Maximum people that can overlap in one time slot on the calendar. */
export const MAX_CALENDAR_OVERLAP = 14;

/** Crayon palette for up to 14 simultaneous users (stable per user id). */
export const USER_COLORS: string[] = [
  "oklch(0.62 0.22 25)", // red
  "oklch(0.58 0.18 250)", // blue
  "oklch(0.6 0.16 145)", // green
  "oklch(0.68 0.18 85)", // yellow
  "oklch(0.55 0.2 300)", // purple
  "oklch(0.65 0.2 45)", // orange
  "oklch(0.58 0.17 200)", // cyan
  "oklch(0.62 0.19 330)", // pink
  "oklch(0.55 0.14 130)", // lime
  "oklch(0.52 0.16 270)", // indigo
  "oklch(0.64 0.15 60)", // gold
  "oklch(0.56 0.18 15)", // coral
  "oklch(0.54 0.15 180)", // teal
  "oklch(0.6 0.17 320)", // magenta
];

export function stableUserColorIndex(userId: string): number {
  let h = 0;
  for (let i = 0; i < userId.length; i++) {
    h = (h * 31 + userId.charCodeAt(i)) >>> 0;
  }
  return h % MAX_CALENDAR_OVERLAP;
}

export function colorForUser(userId: string): string {
  return USER_COLORS[stableUserColorIndex(userId)];
}

export function formatWeekLabel(weekStart: Date): string {
  const weekEnd = addDays(weekStart, 6);
  return `${format(weekStart, "MMM d")} – ${format(weekEnd, "MMM d, yyyy")}`;
}

export function blockDurationLabel(start: Date, end: Date): string {
  const mins = differenceInMinutes(end, start);
  if (mins < 60) return `${mins}m`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}
