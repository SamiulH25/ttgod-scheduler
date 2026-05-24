"use client";

import { format } from "date-fns";
import { PaperCalendarShell } from "@/components/calendar/paper-calendar-shell";
import { TimeGutter } from "@/components/calendar/time-gutter";
import {
  DAY_COLUMN_MIN_WIDTH_DESKTOP_PX,
  getGridMinWidth,
  getGridTemplateColumns,
} from "@/components/calendar/constants";
import {
  getCalendarViewport,
  type CalendarViewPeriod,
  type CalendarViewport,
} from "@/lib/calendar";
import { cn } from "@/lib/utils";

export type WeekTimeGridProps = {
  weekDays: Date[];
  viewPeriod: CalendarViewPeriod;
  renderDayColumn: (
    day: Date,
    viewport: CalendarViewport,
    columnHeight: number,
  ) => React.ReactNode;
  renderDayHeaderExtra?: (day: Date, isToday: boolean) => React.ReactNode;
  dayColumnMinWidth?: number;
  scrollMaxHeight?: string;
  flipKey?: string;
  flipDirection?: "left" | "right";
  enableFlip?: boolean;
  gridRef?: React.RefObject<HTMLDivElement | null>;
  onGridPointerDown?: (e: React.PointerEvent) => void;
  onGridPointerMove?: (e: React.PointerEvent) => void;
  onGridPointerUp?: (e: React.PointerEvent) => void;
  onGridPointerCancel?: (e: React.PointerEvent) => void;
  onGridContextMenu?: (e: React.MouseEvent) => void;
  showTimeGutterLabel?: boolean;
  headerSize?: "default" | "compact";
  className?: string;
};

export function WeekTimeGrid({
  weekDays,
  viewPeriod,
  renderDayColumn,
  renderDayHeaderExtra,
  dayColumnMinWidth = DAY_COLUMN_MIN_WIDTH_DESKTOP_PX,
  scrollMaxHeight,
  flipKey,
  flipDirection = "right",
  enableFlip = false,
  gridRef,
  onGridPointerDown,
  onGridPointerMove,
  onGridPointerUp,
  onGridPointerCancel,
  onGridContextMenu,
  showTimeGutterLabel = true,
  headerSize = "default",
  className,
}: WeekTimeGridProps) {
  const viewport = getCalendarViewport(viewPeriod);
  const columnHeight = viewport.heightPx;
  const gridTemplate = getGridTemplateColumns(dayColumnMinWidth);
  const minWidth = getGridMinWidth(dayColumnMinWidth);
  const todayKey = format(new Date(), "yyyy-MM-dd");

  return (
    <PaperCalendarShell
      flipKey={flipKey}
      flipDirection={flipDirection}
      enableFlip={enableFlip}
      className={className}
    >
      <div
        className={cn(
          "paper-calendar-grid-scroll scroll-paper on-paper overflow-x-auto overflow-y-auto overscroll-contain [scrollbar-gutter:stable]",
          !scrollMaxHeight && "max-h-[min(72vh,780px)]",
        )}
        style={{
          minWidth,
          ...(scrollMaxHeight ? { maxHeight: scrollMaxHeight } : {}),
        }}
        onContextMenu={onGridContextMenu}
      >
        <div
          className="paper-calendar-grid-header sticky top-0 z-30 grid border-b-2 border-[var(--crayon-stroke)] bg-[var(--paper-cream)]"
          style={{ gridTemplateColumns: gridTemplate }}
        >
          <div className="flex items-end justify-center border-r border-[var(--crayon-stroke)]/25 p-2">
            {showTimeGutterLabel ? (
              <span className="text-[10px] font-bold uppercase tracking-wide text-[var(--paper-ink-muted)]">
                Time
              </span>
            ) : (
              <span className="sr-only">Time</span>
            )}
          </div>
          {weekDays.map((day) => {
            const dayKey = format(day, "yyyy-MM-dd");
            const isToday = dayKey === todayKey;
            return (
              <div
                key={dayKey}
                className={cn(
                  "paper-calendar-day-header border-l border-[var(--crayon-stroke)]/25 px-2 py-2 text-center",
                  isToday && "paper-calendar-day-header--today",
                  headerSize === "compact" && "py-1",
                )}
              >
                <div
                  className={cn(
                    "font-bold uppercase tracking-wide text-[var(--paper-ink-muted)]",
                    headerSize === "compact"
                      ? "text-[10px]"
                      : "ink-label text-sm",
                  )}
                >
                  {format(day, "EEE")}
                </div>
                <div
                  className={cn(
                    "font-display font-bold tabular-nums text-[var(--paper-ink)]",
                    headerSize === "compact" ? "text-xs" : "text-xl",
                    isToday && "text-primary",
                  )}
                >
                  {headerSize === "compact"
                    ? format(day, "MMM d")
                    : format(day, "d")}
                </div>
                {renderDayHeaderExtra?.(day, isToday)}
              </div>
            );
          })}
        </div>

        <div
          ref={gridRef}
          className={cn(
            "relative isolate z-0 grid",
            (onGridPointerDown || onGridPointerMove) && "touch-none select-none",
          )}
          style={{
            gridTemplateColumns: gridTemplate,
            height: columnHeight,
          }}
          onPointerDown={onGridPointerDown}
          onPointerMove={onGridPointerMove}
          onPointerUp={onGridPointerUp}
          onPointerCancel={onGridPointerCancel ?? onGridPointerUp}
        >
          <TimeGutter viewport={viewport} />
          {weekDays.map((day) =>
            renderDayColumn(day, viewport, columnHeight),
          )}
        </div>
      </div>
    </PaperCalendarShell>
  );
}
