"use client";

import { format, parseISO } from "date-fns";
import { useState } from "react";
import { WeatherIcon } from "@/components/calendar/weather-icons";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { formatTempF } from "@/lib/weather/format-temp";
import type { DayWeather, HourWeather } from "@/lib/weather/types";

type WeatherHourlyDialogProps = {
  day: DayWeather;
  hours: HourWeather[];
  trigger: React.ReactNode;
};

export function WeatherHourlyDialog({
  day,
  hours,
  trigger,
}: WeatherHourlyDialogProps) {
  const [open, setOpen] = useState(false);
  const dateLabel = format(parseISO(day.date), "EEEE, MMM d");

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="paper-flat max-h-[min(70vh,420px)] max-w-sm overflow-hidden">
        <DialogHeader>
          <DialogTitle className="font-display text-xl">
            {dateLabel}
          </DialogTitle>
          <p className="font-sans text-sm text-muted-foreground">
            {day.label} · high {formatTempF(day.highC)} / low{" "}
            {formatTempF(day.lowC)}
          </p>
        </DialogHeader>
        <ul className="max-h-64 space-y-1 overflow-y-auto scroll-paper pr-1">
          {hours.length === 0 ? (
            <li className="font-sans text-sm text-muted-foreground">
              No hourly data for this day.
            </li>
          ) : (
            hours.map((h) => (
              <li
                key={h.time}
                className="flex items-center justify-between gap-2 rounded-sm border border-border/40 px-2 py-1.5 font-sans text-sm"
              >
                <span className="tabular-nums text-[var(--paper-ink-muted)]">
                  {format(parseISO(h.time), "h a")}
                </span>
                <span className="flex items-center gap-1.5">
                  <WeatherIcon icon={h.icon} className="h-4 w-4 text-primary" />
                  <span className="font-mono font-semibold tabular-nums">
                    {formatTempF(h.tempC)}
                  </span>
                  {h.precipChance != null && h.precipChance > 0 && (
                    <span className="text-xs text-[var(--paper-ink-muted)]">
                      {Math.round(h.precipChance)}%
                    </span>
                  )}
                </span>
              </li>
            ))
          )}
        </ul>
      </DialogContent>
    </Dialog>
  );
}
