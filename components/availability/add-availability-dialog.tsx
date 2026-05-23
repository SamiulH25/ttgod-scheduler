"use client";

import { addDays, setHours, setMinutes, startOfDay } from "date-fns";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { CalendarBlock } from "@/lib/calendar";
import { toLocalDatetimeInputValue } from "@/lib/dates";

type AddAvailabilityDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedBlock: CalendarBlock | null;
  start: string;
  end: string;
  label: string;
  status: "free" | "tentative" | "busy";
  lfgNote: string;
  weeklyRecurrence: boolean;
  onStartChange: (v: string) => void;
  onEndChange: (v: string) => void;
  onLabelChange: (v: string) => void;
  onLfgNoteChange: (v: string) => void;
  onStatusChange: (v: "free" | "tentative" | "busy") => void;
  onWeeklyRecurrenceChange: (v: boolean) => void;
  onSave: (e: React.FormEvent) => void;
  onDelete: () => void;
  onAddNewInstead: () => void;
};

function applyPreset(
  preset: "tonight" | "tomorrow-evening" | "weekend",
  onStart: (v: string) => void,
  onEnd: (v: string) => void,
) {
  const now = new Date();
  if (preset === "tonight") {
    const start = setMinutes(setHours(startOfDay(now), 18), 0);
    const end = setMinutes(setHours(startOfDay(now), 23), 0);
    onStart(toLocalDatetimeInputValue(start));
    onEnd(toLocalDatetimeInputValue(end));
    return;
  }
  if (preset === "tomorrow-evening") {
    const day = addDays(startOfDay(now), 1);
    const start = setMinutes(setHours(day, 17), 0);
    const end = setMinutes(setHours(day, 22), 0);
    onStart(toLocalDatetimeInputValue(start));
    onEnd(toLocalDatetimeInputValue(end));
    return;
  }
  const daysUntilSat = (6 - now.getDay() + 7) % 7;
  const sat = addDays(startOfDay(now), daysUntilSat);
  const sun = addDays(sat, 1);
  onStart(toLocalDatetimeInputValue(setMinutes(setHours(sat, 10), 0)));
  onEnd(toLocalDatetimeInputValue(setMinutes(setHours(sun, 22), 0)));
}

export function AddAvailabilityDialog({
  open,
  onOpenChange,
  selectedBlock,
  start,
  end,
  label,
  status,
  lfgNote,
  weeklyRecurrence,
  onStartChange,
  onEndChange,
  onLabelChange,
  onLfgNoteChange,
  onStatusChange,
  onWeeklyRecurrenceChange,
  onSave,
  onDelete,
  onAddNewInstead,
}: AddAvailabilityDialogProps) {
  const isEdit = Boolean(selectedBlock);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? "Edit crayon block" : "Add availability"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={onSave} className="space-y-4">
          {isEdit && (
            <p className="text-xs text-muted-foreground">
              Adjust times or label, then save. Overlapping blocks may merge into
              one.
            </p>
          )}

          {!isEdit && (
            <div className="space-y-2">
              <span className="prose-label">Quick fill</span>
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    applyPreset("tonight", onStartChange, onEndChange)
                  }
                >
                  Tonight
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    applyPreset("tomorrow-evening", onStartChange, onEndChange)
                  }
                >
                  Tomorrow eve
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    applyPreset("weekend", onStartChange, onEndChange)
                  }
                >
                  Weekend
                </Button>
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="cal-start">Start</Label>
              <Input
                id="cal-start"
                type="datetime-local"
                required
                value={start}
                onChange={(e) => onStartChange(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cal-end">End</Label>
              <Input
                id="cal-end"
                type="datetime-local"
                required
                value={end}
                onChange={(e) => onEndChange(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="cal-status">Status</Label>
            <select
              id="cal-status"
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              value={status}
              onChange={(e) =>
                onStatusChange(e.target.value as "free" | "tentative" | "busy")
              }
            >
              <option value="free">Free</option>
              <option value="tentative">Tentative</option>
              <option value="busy">Busy</option>
            </select>
          </div>

          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={weeklyRecurrence}
              onChange={(e) => onWeeklyRecurrenceChange(e.target.checked)}
            />
            Repeat weekly (stores JSON on block)
          </label>

          <div className="space-y-2">
            <Label htmlFor="cal-label">Label (optional)</Label>
            <Input
              id="cal-label"
              placeholder="e.g. Evening free, WFH afternoon"
              value={label}
              onChange={(e) => onLabelChange(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="cal-lfg">LFG note (optional)</Label>
            <Input
              id="cal-lfg"
              placeholder="LF duo, flex support…"
              value={lfgNote}
              onChange={(e) => onLfgNoteChange(e.target.value)}
              maxLength={200}
            />
          </div>

          <div className="flex flex-wrap gap-2">
            <Button type="submit" className="flex-1">
              {isEdit ? "Save changes" : "Save to squad calendar"}
            </Button>
            {isEdit && (
              <>
                <Button type="button" variant="destructive" onClick={onDelete}>
                  <Trash2 className="h-4 w-4" />
                  Remove
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={onAddNewInstead}
                >
                  Add another
                </Button>
              </>
            )}
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
