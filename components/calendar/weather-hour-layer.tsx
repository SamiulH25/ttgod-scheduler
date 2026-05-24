"use client";

import { WeatherIcon } from "@/components/calendar/weather-icons";
import { formatTempF } from "@/lib/weather/format-temp";
import { weatherForHour } from "@/lib/weather/hour-slot";
import type { HourWeather } from "@/lib/weather/types";
import { getViewportHours, type CalendarViewport } from "@/lib/calendar";
import { cn } from "@/lib/utils";

type WeatherHourLayerProps = {
  dayKey: string;
  viewport: CalendarViewport;
  hours?: HourWeather[];
  className?: string;
};

export function WeatherHourLayer({
  dayKey,
  viewport,
  hours,
  className,
}: WeatherHourLayerProps) {
  if (!hours?.length) return null;

  const hourLabels = getViewportHours(viewport);

  return (
    <div
      className={cn("pointer-events-none absolute inset-0 z-[30]", className)}
      aria-hidden
    >
      {hourLabels.map((hour) => {
        const row = weatherForHour(hours, dayKey, hour);
        if (!row) return null;
        const slotCenterMin = hour * 60 + 30;
        const topPct =
          ((slotCenterMin - viewport.startMin) / viewport.durationMin) * 100;
        const title = `${row.label}, ${formatTempF(row.tempC)}${
          row.precipChance != null ? `, ${row.precipChance}% rain` : ""
        }`;

        return (
          <div
            key={`${dayKey}-${hour}`}
            className="absolute right-2 flex items-center justify-center"
            style={{
              top: `${topPct}%`,
              transform: "translateY(-50%)",
            }}
            title={title}
          >
            <span
              className={cn(
                "flex size-[1.125rem] items-center justify-center rounded-full",
                "border-2 border-[var(--crayon-stroke)] bg-[var(--paper-cream)]",
                "shadow-[0_1px_0_oklch(1_0_0/0.5),0_1px_4px_oklch(0_0_0/0.35)]",
              )}
            >
              <WeatherIcon
                icon={row.icon}
                className="h-2.5 w-2.5 text-[var(--paper-ink)]"
              />
            </span>
          </div>
        );
      })}
    </div>
  );
}
