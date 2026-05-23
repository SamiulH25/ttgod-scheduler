import { format, isSameDay } from "date-fns";
import {
  buildDayLayout,
  formatTime24,
  type CalendarBlock,
  type OverlapBand,
  type SoloRect,
} from "@/lib/calendar";

export type AgendaItemKind = "solo" | "overlap";

export type AgendaItem = {
  id: string;
  kind: AgendaItemKind;
  start: Date;
  end: Date;
  label: string;
  userIds: string[];
  blockId?: string;
  soloRect?: SoloRect;
  overlapBand?: OverlapBand;
};

export function buildAgendaItemsForDay(
  day: Date,
  blocks: CalendarBlock[],
): AgendaItem[] {
  const { soloRects, overlapBands } = buildDayLayout(day, blocks);
  const items: AgendaItem[] = [];

  for (const band of overlapBands) {
    const rangeStart = new Date(day);
    rangeStart.setHours(0, 0, 0, 0);
    rangeStart.setMinutes(band.startMin);
    const rangeEnd = new Date(day);
    rangeEnd.setHours(0, 0, 0, 0);
    rangeEnd.setMinutes(band.endMin);
    const names = band.userIds
      .map((id) => {
        const b = band.blocks.find((bl) => bl.userId === id);
        return b?.user.name?.split(" ")[0] ?? "Member";
      })
      .join(", ");
    items.push({
      id: `overlap-${band.userIds.join("-")}-${band.startMin}`,
      kind: "overlap",
      start: rangeStart,
      end: rangeEnd,
      label: `${band.userIds.length} free: ${names}`,
      userIds: band.userIds,
      overlapBand: band,
    });
  }

  for (const rect of soloRects) {
    const { block } = rect;
    const rangeStart = new Date(block.start);
    const rangeEnd = new Date(block.end);
    if (!isSameDay(rangeStart, day) && !isSameDay(rangeEnd, day)) {
      const dayStart = new Date(day);
      dayStart.setHours(0, 0, 0, 0);
      dayStart.setMinutes(rect.startMin);
      const dayEnd = new Date(day);
      dayEnd.setHours(0, 0, 0, 0);
      dayEnd.setMinutes(rect.endMin);
      items.push({
        id: `solo-${block.id}-${rect.startMin}`,
        kind: "solo",
        start: dayStart,
        end: dayEnd,
        label: `${block.user.name ?? "Member"} · ${formatTime24(dayStart)}–${formatTime24(dayEnd)}`,
        userIds: [block.userId],
        blockId: block.id,
        soloRect: rect,
      });
      continue;
    }
    items.push({
      id: `solo-${block.id}-${rect.startMin}`,
      kind: "solo",
      start: rangeStart,
      end: rangeEnd,
      label: `${block.user.name ?? "Member"}${block.label ? ` · ${block.label}` : ""}`,
      userIds: [block.userId],
      blockId: block.id,
      soloRect: rect,
    });
  }

  return items.sort((a, b) => a.start.getTime() - b.start.getTime());
}

export function countBlocksOnDay(day: Date, blocks: CalendarBlock[]): number {
  const dayKey = format(day, "yyyy-MM-dd");
  return blocks.filter((b) => {
    const s = format(new Date(b.start), "yyyy-MM-dd");
    const e = format(new Date(b.end), "yyyy-MM-dd");
    return s <= dayKey && e >= dayKey;
  }).length;
}
