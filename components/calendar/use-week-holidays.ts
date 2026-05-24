"use client";

import { useMemo } from "react";
import { addDays, format } from "date-fns";
import { canadianHolidaysByDateKey } from "@/lib/holidays/canada";

export function useWeekHolidays(weekStart: Date) {
  const weekKey = format(weekStart, "yyyy-MM-dd");
  return useMemo(() => {
    const start = new Date(weekKey + "T12:00:00");
    const weekEnd = addDays(start, 6);
    return canadianHolidaysByDateKey(start, weekEnd);
  }, [weekKey]);
}
