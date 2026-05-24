"use client";

import { format } from "date-fns";
import { HolidayDayChip } from "@/components/calendar/holiday-day-chip";
import { WeatherHeaderExtra } from "@/components/calendar/weather-header-extra";
import { useWeekHolidays } from "@/components/calendar/use-week-holidays";
import type { WeekWeatherState } from "@/components/calendar/use-week-weather";
import { WeekTimeGrid } from "@/components/calendar/week-time-grid";
import {
  DAY_COLUMN_MIN_WIDTH_DESKTOP_PX,
  getGridMinWidth,
  getGridTemplateColumns,
  TIME_GUTTER_WIDTH_PX,
} from "@/components/calendar/constants";
import { CalendarDayColumn } from "@/components/availability/calendar-day-column";
import { buildDayLayout, type CalendarBlock, type CalendarViewPeriod, type OverlapBand, type SoloRect } from "@/lib/calendar";
import type { AvailabilityViewFilter } from "@/lib/availability-stats";

export const TIME_GUTTER_WIDTH_PX_EXPORT = TIME_GUTTER_WIDTH_PX;
export const DAY_COLUMN_MIN_WIDTH_PX = DAY_COLUMN_MIN_WIDTH_DESKTOP_PX;
export const CALENDAR_GRID_TEMPLATE = getGridTemplateColumns(DAY_COLUMN_MIN_WIDTH_PX);
export const CALENDAR_MIN_WIDTH_PX = getGridMinWidth(DAY_COLUMN_MIN_WIDTH_PX);
export { TIME_GUTTER_WIDTH_PX };

type CalendarGridProps = {
  weekDays: Date[];
  weekKey: string;
  flipDirection: "left" | "right";
  blocks: CalendarBlock[];
  currentUserId: string;
  viewPeriod: CalendarViewPeriod;
  filter: AvailabilityViewFilter;
  focusedUserId: string | null;
  highlightBlockId?: string | null;
  onSoloClick: (rect: SoloRect, e: React.MouseEvent) => void;
  onSoloEdit?: (block: CalendarBlock) => void;
  onSoloRemove?: (blockId: string) => void;
  onOverlapClick: (band: OverlapBand, day: Date, e: React.MouseEvent) => void;
  onDragStart: (day: Date, offsetY: number) => void;
  onDragMove: (offsetY: number) => void;
  onDragEnd: (day: Date, startY: number, endY: number, didDrag: boolean) => void;
  onOverlapBadgeClick?: (day: Date) => void;
  weatherState?: WeekWeatherState;
};

export function CalendarGrid({
  weekDays,
  weekKey,
  flipDirection,
  blocks,
  currentUserId,
  viewPeriod,
  filter,
  focusedUserId,
  highlightBlockId,
  onSoloClick,
  onSoloEdit,
  onSoloRemove,
  onOverlapClick,
  onDragStart,
  onDragMove,
  onDragEnd,
  onOverlapBadgeClick,
  weatherState = { status: "idle" },
}: CalendarGridProps) {
  const holidaysByDate = useWeekHolidays(weekDays[0] ?? new Date());

  return (
    <WeekTimeGrid
      weekDays={weekDays}
      viewPeriod={viewPeriod}
      flipKey={weekKey}
      flipDirection={flipDirection}
      enableFlip
      onGridContextMenu={(e) => e.preventDefault()}
      renderDayHeaderExtra={(day) => {
        const dayKey = format(day, "yyyy-MM-dd");
        const holidayName = holidaysByDate[dayKey];
        const { overlapBands } = buildDayLayout(day, blocks);
        const overlapBadge =
          overlapBands.length > 0 ? (
            <button
              type="button"
              className="inline-block rounded-full bg-[var(--overlap)]/80 px-1.5 py-px font-display text-[9px] font-bold text-[var(--overlap-foreground)] hover:brightness-110"
              title="Jump to overlap"
              onClick={() => onOverlapBadgeClick?.(day)}
            >
              overlap
            </button>
          ) : null;
        return (
          <div className="flex flex-col items-center gap-0.5">
            {holidayName ? <HolidayDayChip name={holidayName} /> : null}
            <WeatherHeaderExtra
              day={day}
              weatherState={weatherState}
              overlapBadge={overlapBadge}
            />
          </div>
        );
      }}
      renderDayColumn={(day, viewport) => {
        const dayKey = format(day, "yyyy-MM-dd");
        const hourWeather =
          weatherState.status === "ready"
            ? weatherState.weather.hoursByDate[dayKey]
            : undefined;
        const holidayName = holidaysByDate[dayKey];
        return (
          <CalendarDayColumn
            key={day.toISOString()}
            day={day}
            blocks={blocks}
            currentUserId={currentUserId}
            viewport={viewport}
            filter={filter}
            focusedUserId={focusedUserId}
            highlightBlockId={highlightBlockId}
            showNowLine
            hourWeather={hourWeather}
            holidayName={holidayName}
            onSoloClick={onSoloClick}
            onSoloEdit={onSoloEdit}
            onSoloRemove={onSoloRemove}
            onOverlapClick={onOverlapClick}
            onDragStart={onDragStart}
            onDragMove={onDragMove}
            onDragEnd={onDragEnd}
          />
        );
      }}
    />
  );
}
