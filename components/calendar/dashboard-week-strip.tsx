"use client";

import Link from "next/link";
import { format, isSameDay } from "date-fns";
import { getWeekDays, getWeekStart } from "@/lib/calendar";
import { cn } from "@/lib/utils";

type WeekEvent = { id: string; title: string; start: Date | null };

type DashboardWeekStripProps = {
  highlightDays?: string[];
  /** Scheduled events shown as tiny links under the day */
  events?: WeekEvent[];
  className?: string;
};

export function DashboardWeekStrip({
  highlightDays = [],
  events = [],
  className,
}: DashboardWeekStripProps) {
  const weekStart = getWeekStart(new Date());
  const weekDays = getWeekDays(weekStart);
  const today = new Date();
  const highlight = new Set(highlightDays);
  const byDay = new Map<string, WeekEvent[]>();
  for (const ev of events) {
    if (!ev.start) continue;
    const key = format(ev.start, "yyyy-MM-dd");
    const list = byDay.get(key) ?? [];
    list.push(ev);
    byDay.set(key, list);
  }

  return (
    <div
      className={cn("flex gap-1.5 overflow-x-auto pt-3", className)}
      aria-label="This week on the calendar"
    >
      {weekDays.map((day) => {
        const key = format(day, "yyyy-MM-dd");
        const isToday = isSameDay(day, today);
        const hasOverlap = highlight.has(key);
        const dayEvents = byDay.get(key) ?? [];
        return (
          <div
            key={key}
            className={cn(
              "paper-calendar-member-chip flex min-w-[2.75rem] flex-col items-stretch py-1.5 text-center",
              isToday && "paper-calendar-member-chip--active",
            )}
          >
            <Link
              href={`/availability?day=${key}&week=${format(weekStart, "yyyy-MM-dd")}`}
              className="flex flex-col items-center no-underline text-inherit"
            >
              <span className="text-[9px] font-bold uppercase text-[var(--paper-ink-muted)]">
                {format(day, "EEE")}
              </span>
              <span
                className={cn(
                  "font-display text-sm font-bold tabular-nums",
                  isToday && "text-primary",
                )}
              >
                {format(day, "d")}
              </span>
              <span className="mt-0.5 flex min-h-[10px] items-center justify-center gap-0.5">
                {hasOverlap && (
                  <span
                    className="size-1 rounded-full bg-[var(--overlap)]"
                    aria-label="Has squad overlap"
                  />
                )}
                {dayEvents.slice(0, 2).map((ev) => (
                  <span
                    key={ev.id}
                    className="size-1 rounded-full bg-primary"
                    title={ev.title}
                    aria-hidden
                  />
                ))}
              </span>
            </Link>
            {dayEvents.length > 0 && (
              <div className="mt-1 flex flex-col gap-0.5 px-0.5">
                {dayEvents.slice(0, 2).map((ev) => (
                  <Link
                    key={ev.id}
                    href={`/events/${ev.id}`}
                    className="truncate rounded-sm border border-[var(--crayon-stroke)]/30 bg-muted/40 px-0.5 py-px text-[8px] font-bold leading-tight text-[var(--paper-ink)] no-underline hover:bg-muted"
                    title={ev.title}
                  >
                    {ev.title.length > 10 ? `${ev.title.slice(0, 9)}…` : ev.title}
                  </Link>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
