"use client";

import {
  formatHourLabel,
  getViewportHours,
  type CalendarViewport,
} from "@/lib/calendar";
import { cn } from "@/lib/utils";
import { hourLabelStyle } from "@/components/calendar/hour-label-style";

type TimeGutterProps = {
  viewport: CalendarViewport;
  showRuledLines?: boolean;
  labelAlign?: "center" | "end";
};

export function TimeGutter({
  viewport,
  showRuledLines = true,
  labelAlign = "end",
}: TimeGutterProps) {
  const hourLabels = getViewportHours(viewport);

  return (
    <div className="relative z-0 overflow-hidden border-r border-[var(--crayon-stroke)]/25 bg-[var(--paper-cream)]">
      {showRuledLines &&
        hourLabels.map((hour) => (
          <div
            key={`gutter-line-${hour}`}
            className={cn(
              "pointer-events-none absolute inset-x-0 border-t",
              hour % 2 === 0
                ? "border-[var(--crayon-stroke)]/15"
                : "border-[var(--crayon-stroke)]/8",
            )}
            style={{
              top: `${((hour * 60 - viewport.startMin) / viewport.durationMin) * 100}%`,
            }}
            aria-hidden
          />
        ))}
      {hourLabels.map((hour) => (
        <div
          key={hour}
          className={cn(
            "absolute inset-x-0 z-[1] tabular-nums font-semibold text-[var(--paper-ink-muted)]",
            labelAlign === "end"
              ? "flex justify-end pr-2 text-[11px]"
              : "text-center text-[10px]",
          )}
          style={hourLabelStyle(hour, viewport, hourLabels)}
        >
          {formatHourLabel(hour)}
        </div>
      ))}
    </div>
  );
}
