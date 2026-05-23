"use client";

import { format, isSameDay } from "date-fns";
import { cn } from "@/lib/utils";
import { countBlocksOnDay } from "@/lib/agenda-items";

type CompactDayStripProps = {
  weekDays: Date[];
  selectedDay: Date;
  onSelectDay: (day: Date) => void;
  blocks?: import("@/lib/calendar").CalendarBlock[];
  className?: string;
};

export function CompactDayStrip({
  weekDays,
  selectedDay,
  onSelectDay,
  blocks = [],
  className,
}: CompactDayStripProps) {
  const today = new Date();

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

        return (
          <button
            key={day.toISOString()}
            type="button"
            role="tab"
            aria-selected={selected}
            className={cn(
              "paper-calendar-member-chip min-w-[3.25rem] flex-col py-2 text-center",
              selected && "paper-calendar-member-chip--active",
              isToday && !selected && "border-primary/40",
            )}
            onClick={() => onSelectDay(day)}
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
            {count > 0 && (
              <span className="mt-0.5 size-1.5 rounded-full bg-primary" aria-hidden />
            )}
          </button>
        );
      })}
    </div>
  );
}
