"use client";

import { format, parseISO } from "date-fns";
import { WeatherHourlyDialog } from "@/components/calendar/weather-hourly-dialog";
import { WeatherIcon } from "@/components/calendar/weather-icons";
import { formatTempRangeF } from "@/lib/weather/format-temp";
import type { DayWeather, HourWeather } from "@/lib/weather/types";
import { cn } from "@/lib/utils";

type WeatherDayChipProps = {
  day: DayWeather;
  hours: HourWeather[];
  compact?: boolean;
  className?: string;
};

export function WeatherDayChip({
  day,
  hours,
  compact = false,
  className,
}: WeatherDayChipProps) {
  const label = `${day.label}, ${formatTempRangeF(day.highC, day.lowC)}`;

  const trigger = (
    <button
      type="button"
      className={cn(
        "inline-flex items-center justify-center gap-0.5 rounded-sm border border-transparent px-1 py-0.5 transition-colors hover:border-[var(--ink-pencil)]/30 hover:bg-muted/30",
        compact ? "flex-col gap-0" : "mt-0.5 w-full",
        className,
      )}
      aria-label={`Weather for ${format(parseISO(day.date), "MMM d")}: ${label}. Open hourly forecast.`}
      onClick={(e) => e.stopPropagation()}
      onKeyDown={(e) => e.stopPropagation()}
    >
      <WeatherIcon
        icon={day.icon}
        className={cn(compact ? "h-3.5 w-3.5" : "h-4 w-4", "text-primary")}
      />
      <span
        className={cn(
          "font-mono font-semibold tabular-nums text-[var(--paper-ink-muted)]",
          compact ? "text-[9px] leading-tight" : "text-[10px]",
        )}
      >
        {formatTempRangeF(day.highC, day.lowC)}
      </span>
    </button>
  );

  return <WeatherHourlyDialog day={day} hours={hours} trigger={trigger} />;
}
