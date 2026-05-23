"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { addDays, addWeeks, format, isSameDay, parseISO, subWeeks } from "date-fns";
import { useSearchParams } from "next/navigation";
import { MousePointer2, Plus } from "lucide-react";
import { toast } from "sonner";
import { AgendaDayList } from "@/components/calendar/agenda-day-list";
import { CompactDayStrip } from "@/components/calendar/compact-day-strip";
import { WeekToolbar } from "@/components/calendar/week-toolbar";
import { EmptyState } from "@/components/empty-state";
import { AddAvailabilityDialog } from "@/components/availability/add-availability-dialog";
import { CalendarGrid } from "@/components/availability/calendar-grid";
import { SquadRoster } from "@/components/availability/squad-roster";
import { SlotFreeUsers } from "@/components/slot-free-users";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  getCalendarViewport,
  getWeekDays,
  getWeekEnd,
  getWeekStart,
  slotFromDayClickInViewport,
  slotFromDayDragInViewport,
  yToMinutesInViewport,
  type CalendarBlock,
  type CalendarViewPeriod,
  type OverlapBand,
  type SoloRect,
} from "@/lib/calendar";
import type { AgendaItem } from "@/lib/agenda-items";
import { buildAgendaItemsForDay } from "@/lib/agenda-items";
import {
  buildSquadRoster,
  countMyBlocks,
  countWeekOverlapBands,
  type AvailabilityViewFilter,
} from "@/lib/availability-stats";
import { datetimeLocalToISO, toLocalDatetimeInputValue } from "@/lib/dates";

type AvailabilityCalendarProps = {
  currentUserId: string;
};

export function AvailabilityCalendar({ currentUserId }: AvailabilityCalendarProps) {
  const searchParams = useSearchParams();
  const [weekStart, setWeekStart] = useState(() => getWeekStart(new Date()));
  const [mobileDay, setMobileDay] = useState(() => new Date());
  const [flipDirection, setFlipDirection] = useState<"left" | "right">("right");
  const [blocks, setBlocks] = useState<CalendarBlock[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [label, setLabel] = useState("");
  const [selectedBlock, setSelectedBlock] = useState<CalendarBlock | null>(null);
  const [viewPeriod, setViewPeriod] = useState<CalendarViewPeriod>("full");
  const [highlightBlockId, setHighlightBlockId] = useState<string | null>(null);
  const [viewFilter, setViewFilter] = useState<AvailabilityViewFilter>("all");
  const [focusedUserId, setFocusedUserId] = useState<string | null>(null);
  const [rosterCollapsed, setRosterCollapsed] = useState(false);
  const [status, setStatus] = useState<"free" | "tentative" | "busy">("free");
  const [lfgNote, setLfgNote] = useState("");
  const [weeklyRecurrence, setWeeklyRecurrence] = useState(false);
  const [copyWeekBusy, setCopyWeekBusy] = useState(false);
  const dragAnchorRef = useRef<{ day: Date; startMin: number } | null>(null);

  const viewport = useMemo(() => getCalendarViewport(viewPeriod), [viewPeriod]);
  const columnHeight = viewport.heightPx;
  const weekDays = useMemo(() => getWeekDays(weekStart), [weekStart]);
  const weekEnd = useMemo(() => getWeekEnd(weekStart), [weekStart]);
  const weekKey = format(weekStart, "yyyy-MM-dd");
  const weekRangeLabel = `${format(weekStart, "MMM d")} – ${format(addDays(weekEnd, -1), "MMM d, yyyy")}`;

  useEffect(() => {
    const weekParam = searchParams.get("week");
    const dayParam = searchParams.get("day");
    if (weekParam) {
      const parsed = parseISO(weekParam);
      if (!Number.isNaN(parsed.getTime())) {
        setWeekStart(getWeekStart(parsed));
      }
    }
    if (dayParam) {
      const parsed = parseISO(dayParam);
      if (!Number.isNaN(parsed.getTime())) {
        setMobileDay(parsed);
        setWeekStart(getWeekStart(parsed));
      }
    }
  }, [searchParams]);

  const roster = useMemo(
    () => buildSquadRoster(blocks, currentUserId),
    [blocks, currentUserId],
  );
  const overlapCount = useMemo(
    () => countWeekOverlapBands(blocks, weekDays),
    [blocks, weekDays],
  );
  const myBlockCount = useMemo(
    () => countMyBlocks(blocks, currentUserId),
    [blocks, currentUserId],
  );

  const mobileOverlapSlot = useMemo(() => {
    const items = buildAgendaItemsForDay(mobileDay, blocks);
    const overlap = items.find((i) => i.kind === "overlap");
    return overlap ? { start: overlap.start, end: overlap.end } : null;
  }, [mobileDay, blocks]);

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

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      ) {
        return;
      }
      if (e.key === "ArrowLeft") {
        setFlipDirection("left");
        setWeekStart((w) => subWeeks(w, 1));
      }
      if (e.key === "ArrowRight") {
        setFlipDirection("right");
        setWeekStart((w) => addWeeks(w, 1));
      }
      if (e.key === "t" || e.key === "T") {
        const today = getWeekStart(new Date());
        setWeekStart(today);
        setMobileDay(new Date());
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  function openAddDialog(slotStart: Date, slotEnd: Date) {
    setSelectedBlock(null);
    setStart(toLocalDatetimeInputValue(slotStart));
    setEnd(toLocalDatetimeInputValue(slotEnd));
    setLabel("");
    setLfgNote("");
    setStatus("free");
    setWeeklyRecurrence(false);
    setDialogOpen(true);
  }

  function openEditDialog(block: CalendarBlock) {
    setSelectedBlock(block);
    setStart(toLocalDatetimeInputValue(new Date(block.start)));
    setEnd(toLocalDatetimeInputValue(new Date(block.end)));
    setLabel(block.label ?? "");
    const s = (block.status ?? "free") as "free" | "tentative" | "busy";
    setStatus(s === "busy" || s === "tentative" || s === "free" ? s : "free");
    setLfgNote(block.lfgNote ?? "");
    setWeeklyRecurrence(Boolean(block.recurrenceRule));
    setDialogOpen(true);
  }

  function scrollToBlock(blockId: string) {
    setHighlightBlockId(blockId);
    const el = document.querySelector(`[data-block-id="${blockId}"]`);
    el?.scrollIntoView({ behavior: "smooth", block: "center" });
    window.setTimeout(() => setHighlightBlockId(null), 2000);
  }

  function focusUserOnGrid(userId: string) {
    setFocusedUserId(userId);
    const mine = blocks
      .filter((b) => b.userId === userId)
      .sort(
        (a, b) =>
          new Date(a.start).getTime() - new Date(b.start).getTime(),
      );
    if (mine[0]) {
      scrollToBlock(mine[0].id);
    }
  }

  const handleDragStart = useCallback(
    (day: Date, offsetY: number) => {
      const startMin = yToMinutesInViewport(offsetY, columnHeight, viewport);
      dragAnchorRef.current = { day, startMin };
    },
    [columnHeight, viewport],
  );

  const handleDragMove = useCallback(() => {}, []);

  const handleDragEnd = useCallback(
    (day: Date, startY: number, endY: number, didDrag: boolean) => {
      dragAnchorRef.current = null;

      if (didDrag) {
        const { start: slotStart, end: slotEnd } = slotFromDayDragInViewport(
          day,
          startY,
          endY,
          columnHeight,
          viewport,
        );
        openAddDialog(slotStart, slotEnd);
        return;
      }

      const { start: slotStart, end: slotEnd } = slotFromDayClickInViewport(
        day,
        startY,
        columnHeight,
        viewport,
      );
      openAddDialog(slotStart, slotEnd);
    },
    [columnHeight, viewport],
  );

  function handleSoloClick(rect: SoloRect, e: React.MouseEvent) {
    e.stopPropagation();
    if (rect.block.userId !== currentUserId) return;
    openEditDialog(rect.block);
  }

  function handleOverlapClick(band: OverlapBand, day: Date, e: React.MouseEvent) {
    e.stopPropagation();
    const names = band.userIds
      .map((id) => {
        const b = band.blocks.find((bl) => bl.userId === id);
        return b?.user.name?.split(" ")[0] ?? "Someone";
      })
      .join(", ");
    toast.info(`${band.userIds.length} people free: ${names}`, {
      description: `${formatTime24Short(day, band.startMin)} – ${formatTime24Short(day, band.endMin)}`,
    });
    setViewFilter("overlaps");
    setFocusedUserId(null);
  }

  function formatTime24Short(day: Date, minutes: number) {
    const d = new Date(day);
    d.setHours(0, 0, 0, 0);
    d.setMinutes(minutes);
    return d.toLocaleTimeString(undefined, {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
  }

  function handleOverlapBadgeClick(day: Date) {
    setViewFilter("overlaps");
    setFocusedUserId(null);
    toast.info("Showing overlap zones", {
      description: format(day, "EEEE"),
    });
  }

  function handleAgendaItemClick(item: AgendaItem) {
    if (item.kind === "solo" && item.soloRect) {
      if (item.userIds[0] === currentUserId) {
        openEditDialog(item.soloRect.block);
      } else {
        setFocusedUserId(item.userIds[0]!);
        if (item.blockId) scrollToBlock(item.blockId);
      }
      return;
    }
    if (item.overlapBand) {
      const band = item.overlapBand;
      const names = band.userIds
        .map((id) => {
          const b = band.blocks.find((bl) => bl.userId === id);
          return b?.user.name?.split(" ")[0] ?? "Someone";
        })
        .join(", ");
      toast.info(`${band.userIds.length} people free: ${names}`);
      setViewFilter("overlaps");
    }
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    const startIso = datetimeLocalToISO(start);
    const endIso = datetimeLocalToISO(end);
    const startDate = new Date(startIso);
    const dow = startDate.getUTCDay();

    const body: Record<string, unknown> = {
      start: startIso,
      end: endIso,
      label: label || undefined,
      status,
      lfgNote: lfgNote.trim() || undefined,
    };
    if (weeklyRecurrence) {
      body.recurrenceRule = JSON.stringify({
        type: "weekly" as const,
        interval: 1,
        weekdays: [dow],
      });
    } else if (selectedBlock) {
      body.recurrenceRule = null;
    }

    if (selectedBlock) {
      const res = await fetch(`/api/availability/${selectedBlock.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const err = await res.json();
        toast.error(err.error ?? "Failed to update availability");
        return;
      }
      const data = await res.json();
      if (data.merged) {
        toast.success("Saved — overlapping blocks merged into one");
      } else {
        toast.success("Block updated");
      }
      if (data.block?.id) {
        setHighlightBlockId(data.block.id);
        window.setTimeout(() => setHighlightBlockId(null), 500);
      }
      setDialogOpen(false);
      setSelectedBlock(null);
      load();
      return;
    }

    const res = await fetch("/api/availability", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const err = await res.json();
      toast.error(err.error ?? "Failed to save availability");
      return;
    }
    const data = await res.json();
    if (data.merged) {
      toast.success("Added — merged with your overlapping block");
    } else {
      toast.success("Added to the squad calendar");
    }
    if (data.block?.id) {
      setHighlightBlockId(data.block.id);
      window.setTimeout(() => setHighlightBlockId(null), 500);
    }
    setDialogOpen(false);
    load();
  }

  async function copyLastWeek() {
    setCopyWeekBusy(true);
    const sourceWeekStart = subWeeks(weekStart, 1);
    try {
      const res = await fetch("/api/availability/copy-week", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sourceWeekStart: sourceWeekStart.toISOString(),
          targetWeekStart: weekStart.toISOString(),
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        toast.error(err.error ?? "Could not copy week");
        return;
      }
      const data = await res.json();
      const n = data.created?.length ?? 0;
      toast.success(n > 0 ? `Copied ${n} blocks from last week` : "Nothing to copy last week");
      load();
    } finally {
      setCopyWeekBusy(false);
    }
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

  return (
    <div className="space-y-4">
      <div
        className="paper-calendar-toolbar availability-toolbar paper-sheet tape-both tape-tl tape-tr sticky top-0 z-[var(--z-sticky)] flex flex-wrap items-center justify-between gap-3 px-3 py-3"
        style={{ "--paper-tilt": "0deg" } as React.CSSProperties}
      >
        <WeekToolbar
          weekStart={weekStart}
          onPrevWeek={() => {
            setFlipDirection("left");
            setWeekStart((w) => subWeeks(w, 1));
          }}
          onNextWeek={() => {
            setFlipDirection("right");
            setWeekStart((w) => addWeeks(w, 1));
          }}
          onToday={() => {
            setWeekStart(getWeekStart(new Date()));
            setMobileDay(new Date());
          }}
          onCopyLastWeek={() => void copyLastWeek()}
          copyLastWeekBusy={copyWeekBusy}
          viewPeriod={viewPeriod}
          onViewPeriodChange={setViewPeriod}
          weekRangeLabel={weekRangeLabel}
          tearOff
        />
        <Button
          type="button"
          onClick={() => {
            const now = new Date();
            openAddDialog(now, new Date(now.getTime() + 2 * 60 * 60 * 1000));
          }}
        >
          <Plus className="h-4 w-4" />
          Add block
        </Button>
      </div>

      <div className="flex flex-wrap items-center gap-2 rounded-sm border border-dashed border-[var(--ink-pencil)]/40 bg-[var(--paper-cream)]/60 px-3 py-2 text-sm text-[var(--paper-ink-muted)]">
        <MousePointer2 className="size-4 shrink-0 text-primary" aria-hidden />
        <span>
          <strong className="text-[var(--paper-ink)]">Drag</strong> to paint ·{" "}
          <strong className="text-[var(--paper-ink)]">Click</strong> yours to edit ·{" "}
          <kbd className="rounded border px-1 text-[10px]">←</kbd>{" "}
          <kbd className="rounded border px-1 text-[10px]">→</kbd> week ·{" "}
          <kbd className="rounded border px-1 text-[10px]">T</kbd> today
        </span>
      </div>

      {!loading && (
        <SquadRoster
          members={roster}
          totalBlocks={blocks.length}
          overlapCount={overlapCount}
          myBlockCount={myBlockCount}
          currentUserId={currentUserId}
          filter={viewFilter}
          onFilterChange={setViewFilter}
          focusedUserId={focusedUserId}
          onFocusUser={setFocusedUserId}
          onMemberFocus={focusUserOnGrid}
          collapsed={rosterCollapsed}
          onCollapsedChange={setRosterCollapsed}
        />
      )}

      {loading ? (
        <div className="space-y-3">
          <Skeleton className="h-24 w-full rounded-lg" />
          <Skeleton className="h-[min(72vh,720px)] w-full rounded-xl" />
        </div>
      ) : (
        <>
          {blocks.length === 0 && (
            <EmptyState
              iconName="calendar"
              title="Blank week"
              description="Drag on the grid below to post your first crayon block, or tap Add block."
              className="max-w-lg"
            />
          )}

          <div className="space-y-4 lg:hidden">
            <CompactDayStrip
              weekDays={weekDays}
              selectedDay={mobileDay}
              onSelectDay={setMobileDay}
              blocks={blocks}
            />
            {mobileOverlapSlot && (
              <div className="paper-sheet px-3 py-2">
                <p className="mb-1 font-display text-xs font-bold text-[var(--paper-ink-muted)]">
                  Squad free this overlap
                </p>
                <SlotFreeUsers
                  start={mobileOverlapSlot.start}
                  end={mobileOverlapSlot.end}
                  compact
                />
              </div>
            )}
            <AgendaDayList
              day={mobileDay}
              blocks={blocks}
              currentUserId={currentUserId}
              onItemClick={handleAgendaItemClick}
              onPaintSlot={() => {
                const slotStart = defaultSlotStart(mobileDay);
                openAddDialog(
                  slotStart,
                  new Date(slotStart.getTime() + 2 * 60 * 60 * 1000),
                );
              }}
            />
          </div>

          <div className="hidden lg:block">
            <CalendarGrid
              weekDays={weekDays}
              weekKey={weekKey}
              flipDirection={flipDirection}
              blocks={blocks}
              currentUserId={currentUserId}
              viewPeriod={viewPeriod}
              filter={viewFilter}
              focusedUserId={focusedUserId}
              highlightBlockId={highlightBlockId}
              onSoloClick={handleSoloClick}
              onOverlapClick={handleOverlapClick}
              onDragStart={handleDragStart}
              onDragMove={handleDragMove}
              onDragEnd={handleDragEnd}
              onOverlapBadgeClick={handleOverlapBadgeClick}
            />
          </div>
        </>
      )}

      <AddAvailabilityDialog
        open={dialogOpen}
        onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) setSelectedBlock(null);
        }}
        selectedBlock={selectedBlock}
        start={start}
        end={end}
        label={label}
        status={status}
        lfgNote={lfgNote}
        weeklyRecurrence={weeklyRecurrence}
        onStartChange={setStart}
        onEndChange={setEnd}
        onLabelChange={setLabel}
        onLfgNoteChange={setLfgNote}
        onStatusChange={setStatus}
        onWeeklyRecurrenceChange={setWeeklyRecurrence}
        onSave={handleSave}
        onDelete={handleDelete}
        onAddNewInstead={() => {
          const now = new Date();
          openAddDialog(now, new Date(now.getTime() + 2 * 60 * 60 * 1000));
        }}
      />
    </div>
  );
}

function defaultSlotStart(day: Date) {
  const now = new Date();
  if (isSameDay(day, now)) return now;
  const d = new Date(day);
  d.setHours(18, 0, 0, 0);
  return d;
}
