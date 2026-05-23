"use client";

import { ChevronLeft, ChevronRight, Copy } from "lucide-react";
import { SegmentIndicator } from "@/components/motion/segment-indicator";
import { Button } from "@/components/ui/button";
import {
  formatWeekLabel,
  type CalendarViewPeriod,
} from "@/lib/calendar";
import { cn } from "@/lib/utils";

const VIEW_PERIOD_LABELS: Record<CalendarViewPeriod, string> = {
  full: "Full day",
  am: "Morning",
  pm: "Afternoon",
};

type WeekToolbarProps = {
  weekStart: Date;
  onPrevWeek: () => void;
  onNextWeek: () => void;
  onToday: () => void;
  viewPeriod?: CalendarViewPeriod;
  onViewPeriodChange?: (period: CalendarViewPeriod) => void;
  weekRangeLabel?: string;
  /** Copy blocks from the previous ISO week into this week (server merge rules apply per block). */
  onCopyLastWeek?: () => void | Promise<void>;
  copyLastWeekBusy?: boolean;
  compact?: boolean;
  /** Subtle torn-paper hover on the toolbar strip */
  tearOff?: boolean;
  className?: string;
};

export function WeekToolbar({
  weekStart,
  onPrevWeek,
  onNextWeek,
  onToday,
  viewPeriod,
  onViewPeriodChange,
  weekRangeLabel,
  onCopyLastWeek,
  copyLastWeekBusy,
  compact = false,
  tearOff = false,
  className,
}: WeekToolbarProps) {
  return (
    <div
      className={cn(
        "flex flex-wrap items-center justify-between gap-2",
        tearOff && "week-toolbar-tear",
        className,
      )}
    >
      <div className="flex flex-wrap items-center gap-1">
        <Button
          type="button"
          variant="outline"
          size="icon"
          className={compact ? "h-8 w-8" : undefined}
          disablePressable={!compact}
          onClick={onPrevWeek}
          aria-label="Previous week"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <div className={cn("text-center", compact ? "min-w-[140px]" : "min-w-[10rem]")}>
          <p
            className={cn(
              "font-display font-bold text-[var(--paper-ink)]",
              compact ? "text-sm" : "text-xl",
            )}
          >
            {formatWeekLabel(weekStart)}
          </p>
          {weekRangeLabel && !compact && (
            <p className="text-xs text-[var(--paper-ink-muted)]">{weekRangeLabel}</p>
          )}
        </div>
        <Button
          type="button"
          variant="outline"
          size="icon"
          className={compact ? "h-8 w-8" : undefined}
          disablePressable={!compact}
          onClick={onNextWeek}
          aria-label="Next week"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className={compact ? "h-8" : undefined}
          onClick={onToday}
        >
          Today
        </Button>
        {onCopyLastWeek && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            className={compact ? "h-8 gap-1" : "gap-1"}
            disabled={copyLastWeekBusy}
            onClick={() => void onCopyLastWeek()}
          >
            <Copy className="size-3.5" />
            Copy last week
          </Button>
        )}
      </div>

      {viewPeriod && onViewPeriodChange && (
        <div className="relative flex items-center gap-0.5 rounded-lg border border-[var(--crayon-stroke)]/40 bg-muted/30 p-1">
          {(["full", "am", "pm"] as const).map((period) => (
            <button
              key={period}
              type="button"
              className={cn(
                "relative z-10 h-8 rounded-md px-3 text-xs font-semibold transition-colors duration-fast",
                viewPeriod === period
                  ? "font-bold text-[var(--paper-ink)]"
                  : "text-[var(--paper-ink-muted)] hover:text-[var(--paper-ink)]",
              )}
              onClick={() => onViewPeriodChange(period)}
            >
              {viewPeriod === period && (
                <SegmentIndicator layoutId="paper-cal-view-period" />
              )}
              <span className="relative z-10">{VIEW_PERIOD_LABELS[period]}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
