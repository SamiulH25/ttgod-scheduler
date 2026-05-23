"use client";

import { format } from "date-fns";
import { cn } from "@/lib/utils";

type CalendarPadFrameProps = {
  children: React.ReactNode;
  weekStart: Date;
  weekRangeLabel?: string;
  header?: React.ReactNode;
  className?: string;
};

export function CalendarPadFrame({
  children,
  weekStart,
  weekRangeLabel,
  header,
  className,
}: CalendarPadFrameProps) {
  const monthLabel = format(weekStart, "MMMM yyyy");
  const weekNum = format(weekStart, "w");

  return (
    <section className={cn("calendar-pad", className)}>
      <div className="calendar-pad-spiral" aria-hidden />
      <div className="calendar-pad-body min-w-0 flex-1">
        <div className="tear-off-sheet calendar-pad-header mb-3 px-3 py-3">
          <div className="flex flex-wrap items-end justify-between gap-2 border-b border-dashed border-[var(--ruled-line)] pb-2">
            <div>
              <p className="font-display text-2xl font-bold leading-none text-[var(--paper-ink)]">
                {monthLabel}
              </p>
              <p className="mt-1 font-sans text-xs text-[var(--paper-ink-muted)]">
                Week {weekNum}
                {weekRangeLabel ? ` · ${weekRangeLabel}` : ""}
              </p>
            </div>
            <p className="prose-label hidden sm:block">Desk pad · tear-off week</p>
          </div>
          {header && <div className="mt-3">{header}</div>}
        </div>
        <div className="calendar-pad-grid-area ruled-paper rounded-sm px-1 pb-2">
          {children}
        </div>
      </div>
    </section>
  );
}
