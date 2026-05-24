"use client";

import { format, isSameDay } from "date-fns";
import { HolidayDayChip } from "@/components/calendar/holiday-day-chip";
import { WeatherDayChip } from "@/components/calendar/weather-day-chip";
import { useWeekHolidays } from "@/components/calendar/use-week-holidays";
import type { WeekWeatherState } from "@/components/calendar/use-week-weather";
import { cn } from "@/lib/utils";
import { countBlocksOnDay } from "@/lib/agenda-items";

type CompactDayStripProps = {
  weekDays: Date[];
  selectedDay: Date;
  onSelectDay: (day: Date) => void;
  blocks?: import("@/lib/calendar").CalendarBlock[];
  weatherState?: WeekWeatherState;
  className?: string;
};

export function CompactDayStrip({
  weekDays,
  selectedDay,
  onSelectDay,
  blocks = [],
  weatherState = { status: "idle" },
  className,
}: CompactDayStripProps) {
  const today = new Date();
  const holidaysByDate = useWeekHolidays(weekDays[0] ?? new Date());

  return (
    <div
      className={cn(
        "flex gap-1.5 overflow-x-auto pb-1 scroll-paper",
        className,
      )}
      role="tablist"
      aria-label="Week days"
    >
      {weekDays.map((day) => {
        const selected = isSameDay(day, selectedDay);
        const isToday = isSameDay(day, today);
        const count = countBlocksOnDay(day, blocks);
        const dayKey = format(day, "yyyy-MM-dd");
        const weatherDay =
          weatherState.status === "ready"
            ? weatherState.weather.days.find((d) => d.date === dayKey)
            : null;
        const weatherHours =
          weatherState.status === "ready"
            ? weatherState.weather.hoursByDate[dayKey] ?? []
            : [];
        const holidayName = holidaysByDate[dayKey];

        return (
          <div
            key={day.toISOString()}
            role="tab"
            tabIndex={selected ? 0 : -1}
            aria-selected={selected}
            className={cn(
              "paper-calendar-member-chip min-w-[3.25rem] cursor-pointer flex-col py-2 text-center",
              selected && "paper-calendar-member-chip--active",
              isToday && !selected && "border-primary/40",
            )}
            onClick={() => onSelectDay(day)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onSelectDay(day);
              }
            }}
          >
            <span className="text-[10px] font-bold uppercase text-[var(--paper-ink-muted)]">
              {format(day, "EEE")}
            </span>
            <span
              className={cn(
                "font-display text-lg font-bold tabular-nums",
                isToday && "text-primary",
              )}
            >
              {format(day, "d")}
            </span>
            {holidayName ? (
              <HolidayDayChip
                name={holidayName}
                compact
                className="mt-0.5 max-w-full"
              />
            ) : null}
            {weatherDay ? (
              <WeatherDayChip
                day={weatherDay}
                hours={weatherHours}
                compact
                className="mt-0.5"
              />
            ) : count > 0 ? (
              <span className="mt-0.5 size-1.5 rounded-full bg-primary" aria-hidden />
            ) : null}
          </div>
        );
      })}
    </div>
  );
}
