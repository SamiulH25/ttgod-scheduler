"use client";

import { useCallback, useEffect, useState } from "react";
import { addDays, endOfWeek, startOfWeek } from "date-fns";
import { toast } from "sonner";
import {
  RankedSlotList,
  type RankedSlotRow,
} from "@/components/scheduling/ranked-slot-list";
import { createSoftHoldFromOverlap } from "@/components/soft-holds-panel";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { CalendarSearch } from "lucide-react";

const DURATION_OPTIONS = [
  { value: "30", label: "30 min" },
  { value: "60", label: "1 hour" },
  { value: "120", label: "2 hours" },
  { value: "180", label: "3 hours" },
];

type FindTimePanelProps = {
  defaultDurationMinutes?: number;
  defaultHorizon?: "week" | "twoWeeks";
  className?: string;
  compact?: boolean;
};

export function FindTimePanel({
  defaultDurationMinutes = 120,
  defaultHorizon = "twoWeeks",
  className,
  compact,
}: FindTimePanelProps) {
  const [duration, setDuration] = useState(String(defaultDurationMinutes));
  const [horizon, setHorizon] = useState<"week" | "twoWeeks">(defaultHorizon);
  const [slots, setSlots] = useState<RankedSlotRow[]>([]);
  const [busy, setBusy] = useState(false);
  const [loaded, setLoaded] = useState(false);

  const range = useCallback(() => {
    const from = startOfWeek(new Date(), { weekStartsOn: 1 });
    const to =
      horizon === "week"
        ? endOfWeek(from, { weekStartsOn: 1 })
        : addDays(from, 14);
    return { from, to };
  }, [horizon]);

  const loadSlots = useCallback(async () => {
    setBusy(true);
    const { from, to } = range();
    const params = new URLSearchParams({
      from: from.toISOString(),
      to: to.toISOString(),
      durationMinutes: duration,
    });
    const res = await fetch(`/api/scheduling/find-slots?${params}`);
    setBusy(false);
    if (!res.ok) {
      toast.error("Could not find times");
      return;
    }
    const data = await res.json();
    setSlots((data.slots ?? []) as RankedSlotRow[]);
    setLoaded(true);
  }, [duration, range]);

  useEffect(() => {
    void loadSlots();
  }, [loadSlots]);

  return (
    <div
      className={cn(
        "paper-flat space-y-3 p-3",
        compact && "p-2",
        className,
      )}
    >
      <p className="font-display text-sm font-bold">Plan a session</p>
      <div className="flex flex-wrap items-end gap-3">
        <div className="space-y-1">
          <Label className="text-xs">Duration</Label>
          <Select value={duration} onValueChange={setDuration}>
            <SelectTrigger className="h-9 w-[120px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {DURATION_OPTIONS.map((o) => (
                <SelectItem key={o.value} value={o.value}>
                  {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Horizon</Label>
          <div className="flex gap-1">
            <Button
              type="button"
              size="sm"
              variant={horizon === "week" ? "default" : "outline"}
              onClick={() => setHorizon("week")}
            >
              This week
            </Button>
            <Button
              type="button"
              size="sm"
              variant={horizon === "twoWeeks" ? "default" : "outline"}
              onClick={() => setHorizon("twoWeeks")}
            >
              Next 2 weeks
            </Button>
          </div>
        </div>
        <Button
          type="button"
          size="sm"
          variant="secondary"
          disabled={busy}
          onClick={() => void loadSlots()}
        >
          <CalendarSearch className="size-3.5" />
          Refresh
        </Button>
      </div>

      {loaded && (
        <RankedSlotList
          slots={slots}
          busy={busy}
          onHold={(start, end) =>
            void createSoftHoldFromOverlap("Squad session", start, end)
          }
          campaignHref={(start, end) =>
            `/events?start=${encodeURIComponent(start)}&end=${encodeURIComponent(end)}`
          }
          emptyMessage="No squad overlaps in this range — post availability on the calendar."
        />
      )}
    </div>
  );
}
