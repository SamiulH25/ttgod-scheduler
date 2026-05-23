import { endOfDay, format, startOfDay } from "date-fns";
import type { CalendarViewport } from "@/lib/calendar";
import { clipIntervalToViewport, DAY_MINUTES } from "@/lib/calendar";
import type { EventTimeRange } from "@/lib/event-conflicts";
import { toEventDate } from "@/lib/event-conflicts";
import { stickyColorForId } from "@/lib/sticky-colors";

export type SegmentPosition = "single" | "start" | "middle" | "end";

export type EventDaySegment = {
  eventId: string;
  title: string;
  startMin: number;
  endMin: number;
  topPercent: number;
  heightPercent: number;
  color: string;
  position: SegmentPosition;
};

function dayKey(d: Date): string {
  return format(d, "yyyy-MM-dd");
}

function minutesOnDay(date: Date): number {
  return date.getHours() * 60 + date.getMinutes();
}

export function intervalSegmentForDay(
  day: Date,
  rangeStart: Date,
  rangeEnd: Date,
  viewport: CalendarViewport,
  meta: { eventId: string; title: string; color?: string },
): EventDaySegment | null {
  if (rangeEnd <= rangeStart) return null;

  const dayStart = startOfDay(day);
  const dayEnd = endOfDay(day);
  if (rangeEnd <= dayStart || rangeStart >= dayEnd) return null;

  const startKey = dayKey(rangeStart);
  const endKey = dayKey(rangeEnd);
  const thisKey = dayKey(day);

  let position: SegmentPosition;
  let segStartMin: number;
  let segEndMin: number;

  if (startKey === endKey && startKey === thisKey) {
    position = "single";
    segStartMin = minutesOnDay(rangeStart);
    segEndMin = minutesOnDay(rangeEnd);
  } else if (thisKey === startKey) {
    position = "start";
    segStartMin = minutesOnDay(rangeStart);
    segEndMin = DAY_MINUTES;
  } else if (thisKey === endKey) {
    position = "end";
    segStartMin = 0;
    segEndMin = minutesOnDay(rangeEnd);
  } else {
    position = "middle";
    segStartMin = 0;
    segEndMin = DAY_MINUTES;
  }

  const clip = clipIntervalToViewport(segStartMin, segEndMin, viewport);
  if (!clip) return null;

  return {
    eventId: meta.eventId,
    title: meta.title,
    startMin: clip.startMin,
    endMin: clip.endMin,
    topPercent: clip.topPercent,
    heightPercent: clip.heightPercent,
    color: meta.color ?? "var(--primary)",
    position,
  };
}

export function getEventSegmentsForDay(
  day: Date,
  events: EventTimeRange[],
  viewport: CalendarViewport,
): EventDaySegment[] {
  const segments: EventDaySegment[] = [];

  for (const ev of events) {
    if (ev.start == null || ev.end == null) continue;
    const start = toEventDate(ev.start);
    const end = toEventDate(ev.end);
    const seg = intervalSegmentForDay(day, start, end, viewport, {
      eventId: ev.id,
      title: ev.title,
      color: stickyColorForId(ev.id).bg,
    });
    if (seg) segments.push(seg);
  }

  return segments;
}

/** @deprecated Use intervalSegmentForDay */
export function selectionSegmentForDay(
  day: Date,
  startVal: string,
  endVal: string,
  viewport: CalendarViewport,
): EventDaySegment | null {
  if (!startVal || !endVal) return null;
  const start = new Date(startVal);
  const end = new Date(endVal);
  return intervalSegmentForDay(day, start, end, viewport, {
    eventId: "__selection__",
    title: "New event",
    color: "var(--primary)",
  });
}

export function segmentPositionClass(position: SegmentPosition): string {
  switch (position) {
    case "single":
      return "rounded-sm";
    case "start":
      return "rounded-t-sm rounded-b-none";
    case "middle":
      return "rounded-none";
    case "end":
      return "rounded-b-sm rounded-t-none";
  }
}
