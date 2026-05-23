"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { getWeekEnd, getWeekStart } from "@/lib/calendar";
import { format } from "date-fns";
import { ChevronDown } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type Cell = { dayIndex: number; hour: number; count: number };

export function SquadHeatmapCard() {
  const [open, setOpen] = useState(false);
  const [cells, setCells] = useState<Cell[]>([]);
  const weekStart = useMemo(() => getWeekStart(new Date()), []);

  const load = useCallback(async () => {
    const from = weekStart;
    const to = getWeekEnd(weekStart);
    const res = await fetch(
      `/api/squad/heatmap?from=${from.toISOString()}&to=${to.toISOString()}`,
    );
    if (!res.ok) return;
    const data = await res.json();
    setCells(data.cells ?? []);
  }, [weekStart]);

  useEffect(() => {
    void load();
  }, [load]);

  const max = useMemo(() => Math.max(1, ...cells.map((c) => c.count)), [cells]);

  return (
    <Card tiltId="squad-heatmap">
      <CardHeader className="pb-2">
        <button
          type="button"
          className="flex w-full items-center justify-between gap-2 text-left"
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
        >
          <div>
            <CardTitle className="font-display">When we&apos;re usually free</CardTitle>
            <p className="mt-1 text-xs text-muted-foreground">
              Guild-wide free-hour heat (last 8 weeks aggregate).
            </p>
          </div>
          <ChevronDown
            className={cn("size-5 shrink-0 text-muted-foreground transition-transform", open && "rotate-180")}
          />
        </button>
      </CardHeader>
      {open && (
      <CardContent className="overflow-x-auto">
        <div className="inline-block min-w-[640px] space-y-0.5">
          <div className="grid grid-cols-[48px_repeat(7,minmax(0,1fr))] gap-0.5">
            <div />
            {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => (
              <div key={d} className="text-center text-[10px] font-bold text-muted-foreground">
                {d}
              </div>
            ))}
          </div>
          {Array.from({ length: 24 }, (_, hour) => (
            <div
              key={hour}
              className="grid grid-cols-[48px_repeat(7,minmax(0,1fr))] gap-0.5"
            >
              <div className="pr-1 text-right text-[10px] text-muted-foreground">{hour}</div>
              {Array.from({ length: 7 }, (_, dayIndex) => {
                const c = cells.find((x) => x.dayIndex === dayIndex && x.hour === hour);
                const n = c?.count ?? 0;
                const t = n / max;
                return (
                  <div
                    key={dayIndex}
                    className={cn(
                      "h-4 rounded-sm border border-border/20",
                      n === 0 && "bg-muted/30",
                    )}
                    style={
                      n > 0
                        ? {
                            backgroundColor: `rgba(124, 184, 124, ${0.15 + t * 0.75})`,
                          }
                        : undefined
                    }
                    title={`${n} free`}
                  />
                );
              })}
            </div>
          ))}
          <p className="mt-2 text-[10px] text-muted-foreground">
            Week of {format(weekStart, "MMM d, yyyy")}
          </p>
        </div>
      </CardContent>
      )}
    </Card>
  );
}
