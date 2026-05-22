"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { addWeeks, format, subWeeks } from "date-fns";
import { PaperFlip } from "@/components/motion/paper-flip";
import { SegmentIndicator } from "@/components/motion/segment-indicator";
import { CrayonBlock } from "@/components/paper/crayon-block";
import { tiltFromId } from "@/lib/paper-tilt";
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Plus,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { StatusBadge } from "@/components/status-badge";
import { UserAvatar } from "@/components/user-avatar";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  blockVisualTier,
  buildDayLayout,
  colorForUser,
  MAX_CALENDAR_OVERLAP,
  minutesToDate,
  formatHourLabel,
  formatTime24,
  formatWeekLabel,
  getWeekDays,
  getWeekEnd,
  getWeekStart,
  clipIntervalToViewport,
  getCalendarViewport,
  getViewportHours,
  slotFromDayClickInViewport,
  slotFromDayDragInViewport,
  yToMinutesInViewport,
  type CalendarBlock,
  type CalendarViewPeriod,
  type CalendarViewport,
  type OverlapBand,
  type SoloRect,
} from "@/lib/calendar";
import { datetimeLocalToISO, toLocalDatetimeInputValue } from "@/lib/dates";
import { cn } from "@/lib/utils";

const DRAG_THRESHOLD_PX = 6;
const TIME_GUTTER_WIDTH_PX = 72;
const DAY_COLUMN_MIN_WIDTH_PX = 112;
const CALENDAR_GRID_TEMPLATE = `${TIME_GUTTER_WIDTH_PX}px repeat(7, minmax(${DAY_COLUMN_MIN_WIDTH_PX}px, 1fr))`;
const CALENDAR_MIN_WIDTH_PX =
  TIME_GUTTER_WIDTH_PX + 7 * DAY_COLUMN_MIN_WIDTH_PX;

const VIEW_PERIOD_LABELS: Record<CalendarViewPeriod, string> = {
  full: "Full day",
  am: "AM",
  pm: "PM",
};

function hourLabelStyle(
  hour: number,
  viewport: CalendarViewport,
  hours: number[],
): React.CSSProperties {
  const pct =
    ((hour * 60 - viewport.startMin) / viewport.durationMin) * 100;
  if (hour === hours[0]) {
    return { top: 4, transform: "none" };
  }
  if (hour === hours[hours.length - 1]) {
    return { top: "100%", transform: "translateY(calc(-100% - 4px))" };
  }
  return { top: `${pct}%`, transform: "translateY(-50%)" };
}

function blockStyle(topPercent: number, heightPercent: number) {
  return {
    top: `${topPercent}%`,
    height: `${heightPercent}%`,
    minHeight: heightPercent < 0.4 ? 3 : undefined,
  };
}

type AvailabilityCalendarProps = {
  currentUserId: string;
};

type DragPreview = {
  day: Date;
  startMin: number;
  endMin: number;
};

function DayColumn({
  day,
  blocks,
  currentUserId,
  viewport,
  dragPreview,
  onSoloClick,
  onOverlapClick,
  onDragStart,
  onDragMove,
  onDragEnd,
}: {
  day: Date;
  blocks: CalendarBlock[];
  currentUserId: string;
  viewport: CalendarViewport;
  dragPreview: DragPreview | null;
  onSoloClick: (rect: SoloRect, e: React.MouseEvent) => void;
  onOverlapClick: (band: OverlapBand, day: Date, e: React.MouseEvent) => void;
  onDragStart: (day: Date, offsetY: number) => void;
  onDragMove: (offsetY: number) => void;
  onDragEnd: (day: Date, startY: number, endY: number, didDrag: boolean) => void;
}) {
  const columnHeight = viewport.heightPx;
  const hourLabels = getViewportHours(viewport);
  const columnRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef({
    active: false,
    didDrag: false,
    startY: 0,
    lastY: 0,
  });

  const { soloRects, overlapBands } = buildDayLayout(day, blocks);
  const isToday = format(day, "yyyy-MM-dd") === format(new Date(), "yyyy-MM-dd");
  const showPreview =
    dragPreview && format(dragPreview.day, "yyyy-MM-dd") === format(day, "yyyy-MM-dd");

  const handlePointerDown = (e: React.PointerEvent) => {
    if (e.button !== 0) return;

    const rect = columnRef.current?.getBoundingClientRect();
    if (!rect) return;

    dragRef.current = {
      active: true,
      didDrag: false,
      startY: e.clientY - rect.top,
      lastY: e.clientY - rect.top,
    };

    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    onDragStart(day, dragRef.current.startY);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!dragRef.current.active) return;
    const rect = columnRef.current?.getBoundingClientRect();
    if (!rect) return;

    const y = e.clientY - rect.top;
    if (Math.abs(y - dragRef.current.startY) > DRAG_THRESHOLD_PX) {
      dragRef.current.didDrag = true;
    }
    dragRef.current.lastY = y;
    onDragMove(y);
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (!dragRef.current.active) return;
    const rect = columnRef.current?.getBoundingClientRect();
    if (!rect) return;

    const endY = e.clientY - rect.top;
    const { didDrag, startY } = dragRef.current;
    dragRef.current.active = false;

    (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
    onDragEnd(day, startY, endY, didDrag);
  };

  return (
    <div
      ref={columnRef}
      className={cn(
        "relative z-0 touch-none select-none overflow-hidden border-l",
        isToday ? "bg-primary/10" : "bg-[var(--paper-cream)]/80",
      )}
      style={{ height: columnHeight }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
    >
      {hourLabels.map((hour) => (
        <div
          key={hour}
          className={cn(
            "absolute left-0 right-0 border-t",
            hour % 2 === 0 ? "border-border/50" : "border-border/20",
          )}
          style={{
            top: `${((hour * 60 - viewport.startMin) / viewport.durationMin) * 100}%`,
          }}
        />
      ))}

      {showPreview && dragPreview && (() => {
        const clip = clipIntervalToViewport(
          dragPreview.startMin,
          dragPreview.endMin,
          viewport,
        );
        if (!clip) return null;
        return (
          <CrayonBlock
          variant="preview"
          color="var(--ink-pencil)"
          className="pointer-events-none left-1.5 right-1.5 z-[2]"
          style={{
            top: `${clip.topPercent}%`,
            height: `${clip.heightPercent}%`,
          }}
        >
          <span className="absolute left-1 top-0.5 font-display text-xs font-bold text-[var(--crayon-stroke)]">
            {formatTime24(minutesToDate(day, dragPreview.startMin))}
            {" – "}
            {formatTime24(minutesToDate(day, Math.min(dragPreview.endMin, 24 * 60 - 1)))}
          </span>
        </CrayonBlock>
        );
      })()}

      {soloRects.map((rect) => {
        const clip = clipIntervalToViewport(rect.startMin, rect.endMin, viewport);
        if (!clip) return null;
        const { block } = rect;
        const { topPercent, heightPercent, startMin, endMin } = clip;
        const isYours = block.userId === currentUserId;
        const color = colorForUser(block.userId);
        const rangeStart = minutesToDate(day, startMin);
        const rangeEnd = minutesToDate(day, endMin);
        const tier = blockVisualTier(heightPercent);
        const label = `${block.user.name ?? "User"} · ${formatTime24(rangeStart)}–${formatTime24(rangeEnd)}`;

        return (
          <CrayonBlock
            key={`solo-${block.id}-${startMin}-${day.toISOString()}`}
            color={color}
            variant="fill"
            role={isYours ? "button" : undefined}
            tabIndex={isYours ? 0 : undefined}
            onClick={isYours ? (e) => onSoloClick(rect, e) : undefined}
            className={cn(
              "left-1 right-1 z-[1]",
              isYours
                ? "pointer-events-auto cursor-pointer hover:brightness-105"
                : "pointer-events-none",
            )}
            style={blockStyle(topPercent, heightPercent)}
            title={label}
          >
            {tier === "micro" ? null : tier === "compact" ? (
              <div className="flex h-full items-center gap-1.5 px-1.5">
                <UserAvatar
                  name={block.user.name}
                  image={block.user.image}
                  size="xs"
                />
                <span className="truncate font-display text-sm font-bold text-[var(--crayon-stroke)]">
                  {block.user.name?.split(" ")[0] ?? "User"}
                  {isYours && (
                    <span className="font-normal opacity-75"> · you</span>
                  )}
                </span>
              </div>
            ) : (
              <div className="flex h-full flex-col justify-center gap-0.5 px-2 py-1">
                <div className="flex items-center gap-1.5">
                  <UserAvatar
                    name={block.user.name}
                    image={block.user.image}
                    size="xs"
                  />
                  <span className="truncate font-display text-sm font-bold text-[var(--crayon-stroke)]">
                    {block.user.name?.split(" ")[0] ?? "User"}
                    {isYours && (
                      <span className="text-xs font-normal opacity-75">
                        {" "}
                        · you
                      </span>
                    )}
                  </span>
                </div>
                <span className="tabular-nums font-sans text-xs text-[var(--crayon-stroke)]">
                  {formatTime24(rangeStart)}–{formatTime24(rangeEnd)}
                </span>
              </div>
            )}
          </CrayonBlock>
        );
      })}

      {overlapBands.map((band) => {
        const clip = clipIntervalToViewport(band.startMin, band.endMin, viewport);
        if (!clip) return null;
        const { userIds } = band;
        const { topPercent, heightPercent, startMin, endMin } = clip;
        const rangeStart = minutesToDate(day, startMin);
        const rangeEnd = minutesToDate(day, endMin);
        const names = userIds
          .map((id) => {
            const b = band.blocks.find((bl) => bl.userId === id);
            return b?.user.name?.split(" ")[0] ?? "User";
          })
          .slice(0, MAX_CALENDAR_OVERLAP);
        const tier = blockVisualTier(heightPercent);
        const label = `${names.join(", ")} · ${formatTime24(rangeStart)}–${formatTime24(rangeEnd)}`;

        return (
          <CrayonBlock
            key={`overlap-${userIds.join("-")}-${startMin}-${day.toISOString()}`}
            color="var(--overlap)"
            variant="overlap"
            role="button"
            tabIndex={0}
            onClick={(e) => onOverlapClick(band, day, e)}
            className="pointer-events-auto left-1 right-1 z-[2] cursor-default"
            style={blockStyle(topPercent, heightPercent)}
            title={label}
          >
            {tier === "micro" ? (
              <div className="flex h-full items-center justify-center px-1">
                <span className="rounded-md bg-overlap/30 px-1.5 py-px font-display text-[10px] font-bold text-[var(--overlap-foreground)]">
                  {userIds.length}
                </span>
              </div>
            ) : tier === "compact" ? (
              <div className="flex h-full items-center gap-1.5 px-1.5">
                <div className="flex -space-x-1">
                  {userIds.slice(0, 3).map((id) => {
                    const b = band.blocks.find((bl) => bl.userId === id);
                    return (
                      <UserAvatar
                        key={id}
                        name={b?.user.name}
                        image={b?.user.image}
                        size="xs"
                        className="ring-1 ring-overlap-foreground/30"
                      />
                    );
                  })}
                </div>
                <span className="truncate font-display text-[10px] font-bold text-[var(--overlap-foreground)]">
                  {userIds.length} available
                </span>
              </div>
            ) : (
              <div className="flex h-full flex-col justify-center gap-0.5 px-2 py-1">
                <div className="flex items-center gap-1.5">
                  <div className="flex -space-x-1.5">
                    {userIds.slice(0, 4).map((id) => {
                      const b = band.blocks.find((bl) => bl.userId === id);
                      return (
                        <UserAvatar
                          key={id}
                          name={b?.user.name}
                          image={b?.user.image}
                          size="xs"
                          className="ring-1 ring-overlap-foreground/30"
                        />
                      );
                    })}
                  </div>
                  <StatusBadge variant="overlap" className="px-1.5 py-0 text-[9px]">
                    {userIds.length} available
                  </StatusBadge>
                </div>
                <span className="truncate font-display text-xs font-bold text-[var(--overlap-foreground)]">
                  {names.join(", ")}
                </span>
                <span className="tabular-nums font-sans text-[10px] text-[var(--overlap-foreground)] opacity-90">
                  {formatTime24(rangeStart)}–{formatTime24(rangeEnd)}
                </span>
              </div>
            )}
          </CrayonBlock>
        );
      })}
    </div>
  );
}

export function AvailabilityCalendar({ currentUserId }: AvailabilityCalendarProps) {
  const [weekStart, setWeekStart] = useState(() => getWeekStart(new Date()));
  const [flipDirection, setFlipDirection] = useState<"left" | "right">("right");
  const [blocks, setBlocks] = useState<CalendarBlock[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [label, setLabel] = useState("");
  const [selectedBlock, setSelectedBlock] = useState<CalendarBlock | null>(null);
  const [dragPreview, setDragPreview] = useState<DragPreview | null>(null);
  const [viewPeriod, setViewPeriod] = useState<CalendarViewPeriod>("full");
  const [legendOpen, setLegendOpen] = useState(true);
  const dragAnchorRef = useRef<{ day: Date; startMin: number } | null>(null);

  const viewport = useMemo(() => getCalendarViewport(viewPeriod), [viewPeriod]);
  const columnHeight = viewport.heightPx;

  const weekDays = useMemo(() => getWeekDays(weekStart), [weekStart]);
  const weekEnd = useMemo(() => getWeekEnd(weekStart), [weekStart]);

  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({
      from: weekStart.toISOString(),
      to: weekEnd.toISOString(),
    });
    const res = await fetch(`/api/availability?${params}`);
    setLoading(false);
    if (!res.ok) {
      toast.error("Failed to load availability");
      return;
    }
    const data = await res.json();
    setBlocks(data.blocks);
  }, [weekStart, weekEnd]);

  useEffect(() => {
    load();
  }, [load]);

  function openAddDialog(slotStart: Date, slotEnd: Date) {
    setSelectedBlock(null);
    setStart(toLocalDatetimeInputValue(slotStart));
    setEnd(toLocalDatetimeInputValue(slotEnd));
    setLabel("");
    setDialogOpen(true);
  }

  const handleDragStart = useCallback(
    (day: Date, offsetY: number) => {
      const startMin = yToMinutesInViewport(offsetY, columnHeight, viewport);
      dragAnchorRef.current = { day, startMin };
      setDragPreview({ day, startMin, endMin: startMin + 60 });
    },
    [columnHeight, viewport],
  );

  const handleDragMove = useCallback(
    (offsetY: number) => {
      const anchor = dragAnchorRef.current;
      if (!anchor) return;

      const currentMin = yToMinutesInViewport(offsetY, columnHeight, viewport);
      const startMin = Math.min(anchor.startMin, currentMin);
      const endMin = Math.max(anchor.startMin, currentMin, startMin + 30);

      setDragPreview({
        day: anchor.day,
        startMin,
        endMin: Math.min(endMin, viewport.endMin),
      });
    },
    [columnHeight, viewport],
  );

  const handleDragEnd = useCallback(
    (day: Date, startY: number, endY: number, didDrag: boolean) => {
      const anchor = dragAnchorRef.current;
      dragAnchorRef.current = null;
      setDragPreview(null);

      if (didDrag && anchor) {
        const { start, end } = slotFromDayDragInViewport(
          day,
          startY,
          endY,
          columnHeight,
          viewport,
        );
        openAddDialog(start, end);
        return;
      }

      if (!didDrag) {
        const { start, end } = slotFromDayClickInViewport(
          day,
          startY,
          columnHeight,
          viewport,
        );
        openAddDialog(start, end);
      }
    },
    [columnHeight, viewport],
  );

  function handleSoloClick(rect: SoloRect, e: React.MouseEvent) {
    e.stopPropagation();
    if (rect.block.userId !== currentUserId) return;
    setSelectedBlock(rect.block);
    setDialogOpen(true);
  }

  function handleOverlapClick(band: OverlapBand, day: Date, e: React.MouseEvent) {
    e.stopPropagation();
    const names = band.userIds
      .map((id) => {
        const b = band.blocks.find((bl) => bl.userId === id);
        return b?.user.name?.split(" ")[0] ?? "Someone";
      })
      .join(", ");
    const rangeStart = minutesToDate(day, band.startMin);
    const rangeEnd = minutesToDate(day, band.endMin);
    toast.info(
      `${band.userIds.length} people free (${formatTime24(rangeStart)}–${formatTime24(rangeEnd)}): ${names}`,
    );
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch("/api/availability", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        start: datetimeLocalToISO(start),
        end: datetimeLocalToISO(end),
        label: label || undefined,
      }),
    });
    if (!res.ok) {
      const err = await res.json();
      toast.error(err.error ?? "Failed to save availability");
      return;
    }
    toast.success("Added to the squad calendar");
    setDialogOpen(false);
    load();
  }

  async function handleDelete() {
    if (!selectedBlock) return;
    const res = await fetch(`/api/availability/${selectedBlock.id}`, {
      method: "DELETE",
    });
    if (!res.ok) {
      toast.error("Failed to remove availability");
      return;
    }
    toast.success("Availability removed");
    setDialogOpen(false);
    setSelectedBlock(null);
    load();
  }

  const legendUsers = useMemo(() => {
    const map = new Map<string, CalendarBlock["user"]>();
    for (const b of blocks) map.set(b.userId, b.user);
    return [...map.entries()].sort((a, b) =>
      (a[1].name ?? "").localeCompare(b[1].name ?? ""),
    );
  }, [blocks]);

  const weekKey = format(weekStart, "yyyy-MM-dd");

  const legendPanel = legendUsers.length > 0 && (
    <aside
      className={cn(
        "paper-sheet tape-both tape-tl tape-tr hidden shrink-0 flex-col overflow-hidden transition-[width] duration-fast xl:flex",
        legendOpen ? "w-56 gap-2 p-3" : "w-11 gap-1 p-2",
      )}
      style={{ "--paper-tilt": `${tiltFromId("legend", 1.2)}deg` } as React.CSSProperties}
    >
      <button
        type="button"
        onClick={() => setLegendOpen((open) => !open)}
        aria-expanded={legendOpen}
        aria-controls="calendar-legend-list"
        className={cn(
          "flex w-full items-center gap-1 rounded-sm text-left transition-colors hover:bg-[var(--tape-beige)]/35",
          legendOpen ? "px-1 py-0.5" : "flex-col justify-center px-0 py-1",
        )}
      >
        <span
          className={cn(
            "prose-label",
            legendOpen ? "min-w-0 flex-1 truncate" : "sr-only",
          )}
        >
          On calendar
        </span>
        {!legendOpen && (
          <span
            className="font-display text-sm font-bold tabular-nums text-[var(--paper-ink)]"
            aria-hidden
          >
            {legendUsers.length}
          </span>
        )}
        {legendOpen ? (
          <ChevronRight className="h-4 w-4 shrink-0 text-[var(--paper-ink-muted)]" />
        ) : (
          <ChevronLeft className="h-4 w-4 shrink-0 text-[var(--paper-ink-muted)]" />
        )}
        <span className="sr-only">
          {legendOpen ? "Collapse squad list" : "Expand squad list"}
        </span>
      </button>
      {legendOpen && (
        <ul
          id="calendar-legend-list"
          className="scroll-paper max-h-[min(50vh,320px)] space-y-1.5 overflow-y-auto pr-1"
        >
          {legendUsers.map(([id, user]) => (
            <li
              key={id}
              className="paper-sheet flex items-center gap-2 px-2 py-1.5 text-sm transition-colors hover:bg-[var(--tape-beige)]/35"
              style={
                { "--paper-tilt": `${tiltFromId(id, 1.8)}deg` } as React.CSSProperties
              }
            >
              <span
                className="h-3 w-3 shrink-0 rounded-full border-2 border-[var(--crayon-stroke)]"
                style={{ backgroundColor: colorForUser(id) }}
              />
              <UserAvatar name={user.name} image={user.image} size="xs" />
              <span className="truncate">
                {user.name ?? "User"}
                {id === currentUserId && (
                  <span className="text-muted-foreground"> · you</span>
                )}
              </span>
            </li>
          ))}
        </ul>
      )}
    </aside>
  );

  return (
    <div className="space-y-4">
      <div
        className="paper-sheet tape-both tape-tl tape-tr sticky top-0 z-[var(--z-sticky)] -mx-1 flex flex-wrap items-center justify-between gap-3 px-3 py-3"
        style={{ "--paper-tilt": "0deg" } as React.CSSProperties}
      >
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => {
              setFlipDirection("left");
              setWeekStart((w) => subWeeks(w, 1));
            }}
            aria-label="Previous week"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="min-w-[180px] text-center font-display text-xl font-bold text-[var(--paper-ink)]">
            {formatWeekLabel(weekStart)}
          </span>
          <Button
            variant="outline"
            size="icon"
            onClick={() => {
              setFlipDirection("right");
              setWeekStart((w) => addWeeks(w, 1));
            }}
            aria-label="Next week"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setWeekStart(getWeekStart(new Date()))}
          >
            Today
          </Button>
        </div>
        <div className="relative flex items-center gap-0.5 rounded-lg border border-border/60 bg-muted/30 p-1">
          {(["full", "am", "pm"] as const).map((period) => (
            <button
              key={period}
              type="button"
              className={cn(
                "relative z-10 h-8 rounded-md px-3 text-xs font-medium transition-colors duration-fast",
                viewPeriod === period
                  ? "font-bold text-[var(--paper-ink)]"
                  : "text-[var(--paper-ink-muted)] hover:text-[var(--paper-ink)]",
              )}
              onClick={() => setViewPeriod(period)}
            >
              {viewPeriod === period && (
                <SegmentIndicator layoutId="cal-view-period" />
              )}
              <span className="relative z-10">{VIEW_PERIOD_LABELS[period]}</span>
            </button>
          ))}
        </div>
        <Button
          type="button"
          onClick={() => {
            const now = new Date();
            openAddDialog(now, new Date(now.getTime() + 2 * 60 * 60 * 1000));
          }}
        >
          <Plus className="h-4 w-4" />
          Add availability
        </Button>
      </div>

      <p className="text-sm text-muted-foreground px-1">
        Drag anywhere on a day — including over teammates or your own blocks — to add or
        extend your availability. Draw over your slots to combine them into one block.
        Highlighted bands show only the minutes when multiple people are free.
      </p>

      {loading ? (
        <div className="space-y-3">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-[600px] w-full rounded-xl" />
        </div>
      ) : (
        <div className="flex gap-4">
          <PaperFlip
            flipKey={weekKey}
            direction={flipDirection}
            className="min-w-0 flex-1"
          >
          <div
            className="scroll-paper ruled-paper on-paper max-h-[min(72vh,900px)] overflow-x-auto overflow-y-auto overscroll-contain [scrollbar-gutter:stable]"
            style={{ minWidth: CALENDAR_MIN_WIDTH_PX }}
          >
            <div
              className="on-paper sticky top-0 z-30 grid border-b-2 border-[var(--crayon-stroke)] bg-[var(--paper-cream)]"
              style={{ gridTemplateColumns: CALENDAR_GRID_TEMPLATE }}
            >
              <div className="border-r p-2" aria-hidden />
              {weekDays.map((day) => {
                const isToday =
                  format(day, "yyyy-MM-dd") === format(new Date(), "yyyy-MM-dd");
                return (
                  <div
                    key={day.toISOString()}
                    className={cn(
                      "border-l p-2 text-center",
                      isToday && "bg-primary/15",
                    )}
                  >
                    <div className="ink-label text-base font-bold">
                      {format(day, "EEE")}
                    </div>
                    <div
                      className={cn(
                        "font-display text-lg font-bold text-[var(--paper-ink)]",
                        isToday && "text-primary",
                      )}
                    >
                      {format(day, "MMM d")}
                    </div>
                  </div>
                );
              })}
            </div>

            <div
              className="relative isolate z-0 grid"
              style={{
                gridTemplateColumns: CALENDAR_GRID_TEMPLATE,
                height: columnHeight,
              }}
            >
              <div className="on-paper relative z-0 overflow-hidden border-r border-[var(--crayon-stroke)]/30 bg-[var(--paper-cream)] py-1">
                {getViewportHours(viewport).map((hour) => (
                  <div
                    key={hour}
                    className="absolute inset-x-0 flex justify-center text-[11px] tabular-nums text-[var(--paper-ink-muted)]"
                    style={hourLabelStyle(hour, viewport, getViewportHours(viewport))}
                  >
                    <span className="px-1">{formatHourLabel(hour)}</span>
                  </div>
                ))}
              </div>

              {weekDays.map((day) => (
                <DayColumn
                  key={day.toISOString()}
                  day={day}
                  blocks={blocks}
                  currentUserId={currentUserId}
                  viewport={viewport}
                  dragPreview={dragPreview}
                  onSoloClick={handleSoloClick}
                  onOverlapClick={handleOverlapClick}
                  onDragStart={handleDragStart}
                  onDragMove={handleDragMove}
                  onDragEnd={handleDragEnd}
                />
              ))}
            </div>
          </div>
          </PaperFlip>
          {legendPanel}
        </div>
      )}

      {legendUsers.length > 0 && (
        <div
          className="paper-sheet tape-both tape-tl tape-tr px-3 py-2 xl:hidden"
          style={{ "--paper-tilt": `${tiltFromId("legend-mobile", 0.8)}deg` } as React.CSSProperties}
        >
          <button
            type="button"
            onClick={() => setLegendOpen((open) => !open)}
            aria-expanded={legendOpen}
            aria-controls="calendar-legend-mobile"
            className="flex w-full items-center gap-2 py-1 text-left"
          >
            <span className="prose-label flex-1">On calendar</span>
            <span className="text-sm tabular-nums text-[var(--paper-ink-muted)]">
              {legendUsers.length}
            </span>
            <ChevronDown
              className={cn(
                "h-4 w-4 shrink-0 text-[var(--paper-ink-muted)] transition-transform duration-fast",
                legendOpen && "rotate-180",
              )}
            />
            <span className="sr-only">
              {legendOpen ? "Collapse squad list" : "Expand squad list"}
            </span>
          </button>
          {legendOpen && (
            <div
              id="calendar-legend-mobile"
              className="mt-2 flex flex-wrap gap-2 border-t border-[var(--crayon-stroke)]/25 pt-2"
            >
              {legendUsers.map(([id, user]) => (
                <div
                  key={id}
                  className="paper-sheet flex items-center gap-2 px-2 py-1 text-sm"
                  style={
                    { "--paper-tilt": `${tiltFromId(id, 2)}deg` } as React.CSSProperties
                  }
                >
                  <UserAvatar name={user.name} image={user.image} size="xs" />
                  <span
                    className="h-2 w-2 rounded-full"
                    style={{ backgroundColor: colorForUser(id) }}
                  />
                  <span>
                    {user.name ?? "User"}
                    {id === currentUserId && (
                      <span className="text-muted-foreground"> · you</span>
                    )}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <Dialog
        open={dialogOpen}
        onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) setSelectedBlock(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {selectedBlock ? "Your availability" : "Add availability"}
            </DialogTitle>
          </DialogHeader>
          {selectedBlock ? (
            <div className="space-y-4">
              <p className="tabular-nums text-sm text-muted-foreground">
                {formatTime24(new Date(selectedBlock.start))} –{" "}
                {formatTime24(new Date(selectedBlock.end))}
                {selectedBlock.label && ` · ${selectedBlock.label}`}
              </p>
              <div className="flex gap-2">
                <Button variant="destructive" onClick={handleDelete}>
                  <Trash2 className="h-4 w-4" />
                  Remove
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    const now = new Date();
                    openAddDialog(
                      now,
                      new Date(now.getTime() + 2 * 60 * 60 * 1000),
                    );
                  }}
                >
                  Add new instead
                </Button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSave} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="cal-start">Start</Label>
                  <Input
                    id="cal-start"
                    type="datetime-local"
                    required
                    value={start}
                    onChange={(e) => setStart(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cal-end">End</Label>
                  <Input
                    id="cal-end"
                    type="datetime-local"
                    required
                    value={end}
                    onChange={(e) => setEnd(e.target.value)}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="cal-label">Label (optional)</Label>
                <Input
                  id="cal-label"
                  placeholder="e.g. Evening free"
                  value={label}
                  onChange={(e) => setLabel(e.target.value)}
                />
              </div>
              <Button type="submit" className="w-full">
                Save to calendar
              </Button>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
