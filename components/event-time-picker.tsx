"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { addWeeks, format, subWeeks } from "date-fns";
import { EventDayColumn } from "@/components/calendar/event-day-column";
import type { ProposalSegment } from "@/components/calendar/event-day-column";
import { useWeekPointer } from "@/components/calendar/hooks/use-week-pointer";
import { WeekTimeGrid } from "@/components/calendar/week-time-grid";
import { WeekToolbar } from "@/components/calendar/week-toolbar";
import { DAY_COLUMN_MIN_WIDTH_COMPACT_PX } from "@/components/calendar/constants";
import { CompactDayStrip } from "@/components/calendar/compact-day-strip";
import { SlotFreeUsers } from "@/components/slot-free-users";
import {
  getCalendarViewport,
  getWeekDays,
  getWeekStart,
  slotFromDayClickInViewport,
  type CalendarBlock,
  type CalendarViewPeriod,
} from "@/lib/calendar";
import type { EventTimeRange } from "@/lib/event-conflicts";
import { toLocalDatetimeInputValue } from "@/lib/dates";
import { cn } from "@/lib/utils";

export type EventTimePickerProps = {
  start: string;
  end: string;
  onRangeChange: (start: string, end: string) => void;
  events: EventTimeRange[];
  proposals?: ProposalSegment[];
  ghostBlocks?: CalendarBlock[];
  conflictingEventIds?: Set<string>;
  eventId?: string;
  /** When true, only updates preview; parent confirms add */
  previewOnly?: boolean;
  weekStart?: Date;
  onWeekStartChange?: (weekStart: Date) => void;
  className?: string;
  compactMobile?: boolean;
};

export function EventTimePicker({
  start,
  end,
  onRangeChange,
  events,
  proposals = [],
  ghostBlocks = [],
  conflictingEventIds,
  eventId,
  previewOnly = false,
  weekStart: controlledWeekStart,
  onWeekStartChange,
  className,
  compactMobile = true,
}: EventTimePickerProps) {
  const [internalWeekStart, setInternalWeekStart] = useState(() => {
    if (start) return getWeekStart(new Date(start));
    return getWeekStart(new Date());
  });
  const weekStart = controlledWeekStart ?? internalWeekStart;
  const setWeekStart = onWeekStartChange ?? setInternalWeekStart;

  const [viewPeriod, setViewPeriod] = useState<CalendarViewPeriod>("full");
  const [dragRange, setDragRange] = useState<{
    start: Date;
    end: Date;
  } | null>(null);
  const [commitFlash, setCommitFlash] = useState(false);
  const [mobileDay, setMobileDay] = useState(() => new Date());
  const gridRef = useRef<HTMLDivElement>(null);

  const viewport = useMemo(
    () => getCalendarViewport(viewPeriod),
    [viewPeriod],
  );
  const columnHeight = viewport.heightPx;
  const weekDays = useMemo(() => getWeekDays(weekStart), [weekStart]);

  useEffect(() => {
    if (!start) return;
    const ws = getWeekStart(new Date(start));
    if (format(weekStart, "yyyy-MM-dd") !== format(ws, "yyyy-MM-dd")) {
      setWeekStart(ws);
    }
  }, [start, weekStart, setWeekStart]);

  const applyRange = useCallback(
    (rangeStart: Date, rangeEnd: Date, flash = false) => {
      if (flash) {
        setCommitFlash(true);
        window.setTimeout(() => setCommitFlash(false), 450);
      }
      onRangeChange(
        toLocalDatetimeInputValue(rangeStart),
        toLocalDatetimeInputValue(rangeEnd),
      );
    },
    [onRangeChange],
  );

  const { handlePointerDown, handlePointerMove, handlePointerUp } =
    useWeekPointer({
      weekDays,
      viewport,
      columnHeight,
      gridRef,
      onRangeCommit: applyRange,
      onDragPreview: setDragRange,
      onClickSlot: (day, y) => {
        const click = slotFromDayClickInViewport(
          day,
          y,
          columnHeight,
          viewport,
        );
        applyRange(click.start, click.end);
      },
    });

  const previewStart = dragRange?.start ?? (start ? new Date(start) : null);
  const previewEnd = dragRange?.end ?? (end ? new Date(end) : null);

  const grid = (
    <WeekTimeGrid
      weekDays={weekDays}
      viewPeriod={viewPeriod}
      dayColumnMinWidth={DAY_COLUMN_MIN_WIDTH_COMPACT_PX}
      scrollMaxHeight="min(42vh, 420px)"
      headerSize="compact"
      showTimeGutterLabel={false}
      gridRef={gridRef}
      onGridPointerDown={handlePointerDown}
      onGridPointerMove={handlePointerMove}
      onGridPointerUp={handlePointerUp}
      renderDayColumn={(day, vp) => (
        <EventDayColumn
          key={day.toISOString()}
          day={day}
          events={events}
          proposals={proposals}
          ghostBlocks={ghostBlocks}
          viewport={vp}
          start={start}
          end={end}
          dragRange={dragRange}
          commitFlash={commitFlash}
          conflictingEventIds={conflictingEventIds}
        />
      )}
    />
  );

  return (
    <div className={cn("space-y-2", className)}>
      <p className="text-xs text-muted-foreground">
        Drag across days for multi-day trips, or click a day for a 2-hour slot.
        {previewOnly && " Then confirm to add the slot."}
      </p>

      <WeekToolbar
        weekStart={weekStart}
        onPrevWeek={() => setWeekStart(subWeeks(weekStart, 1))}
        onNextWeek={() => setWeekStart(addWeeks(weekStart, 1))}
        onToday={() => setWeekStart(getWeekStart(new Date()))}
        viewPeriod={viewPeriod}
        onViewPeriodChange={setViewPeriod}
        compact
      />

      {compactMobile && (
        <div className="lg:hidden">
          <CompactDayStrip
            weekDays={weekDays}
            selectedDay={mobileDay}
            onSelectDay={setMobileDay}
          />
        </div>
      )}

      <div className={cn(compactMobile && "max-lg:rounded-lg max-lg:border max-lg:border-[var(--crayon-stroke)]/40")}>
        {grid}
      </div>

      {previewStart && previewEnd && (
        <SlotFreeUsers
          start={previewStart}
          end={previewEnd}
          eventId={eventId}
        />
      )}
    </div>
  );
}
