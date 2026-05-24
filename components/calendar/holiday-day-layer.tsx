"use client";

import { cn } from "@/lib/utils";

type HolidayDayLayerProps = {
  holidayName?: string;
  className?: string;
};

/** Full-column wash for Canadian public holidays (below weather, above blocks). */
export function HolidayDayLayer({
  holidayName,
  className,
}: HolidayDayLayerProps) {
  if (!holidayName) return null;

  return (
    <div
      className={cn(
        "pointer-events-none absolute inset-0 z-[1]",
        "bg-[color-mix(in_oklch,var(--overlap)_12%,transparent)]",
        className,
      )}
      aria-hidden
      title={`${holidayName} — many venues closed`}
    />
  );
}
