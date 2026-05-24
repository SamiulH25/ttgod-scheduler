"use client";

import { cn } from "@/lib/utils";

type HolidayDayChipProps = {
  name: string;
  compact?: boolean;
  className?: string;
};

export function HolidayDayChip({
  name,
  compact = false,
  className,
}: HolidayDayChipProps) {
  return (
    <span
      className={cn(
        "inline-block max-w-full truncate rounded-sm border border-[var(--overlap)]/50 bg-[var(--overlap)]/20 font-display font-bold text-[var(--overlap-foreground)]",
        compact ? "px-1 py-0 text-[8px] leading-tight" : "px-1.5 py-0.5 text-[9px]",
        className,
      )}
      title={name}
    >
      {compact ? abbrevHoliday(name) : name}
    </span>
  );
}

function abbrevHoliday(name: string): string {
  if (name.length <= 10) return name;
  const words = name.split(/\s+/);
  if (words.length > 1) {
    return words.map((w) => w[0]).join("").slice(0, 4);
  }
  return `${name.slice(0, 8)}…`;
}
