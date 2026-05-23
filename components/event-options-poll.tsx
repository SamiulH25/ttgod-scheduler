"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type Opt = { id: string; label: string; sortOrder: number; voteCount: number };

type EventOptionsPollProps = {
  eventId: string;
  phase: string;
  isHost: boolean;
  onChanged: () => void;
};

export function EventOptionsPoll({ eventId, phase, isHost, onChanged }: EventOptionsPollProps) {
  const [options, setOptions] = useState<Opt[]>([]);
  const [myOptionId, setMyOptionId] = useState<string | null>(null);
  const [label, setLabel] = useState("");
  const open = phase === "interest" || phase === "scheduling";

  const load = useCallback(async () => {
    const res = await fetch(`/api/events/${eventId}/options`);
    if (!res.ok) return;
    const data = await res.json();
    setOptions(data.options ?? []);
    setMyOptionId(data.myOptionId ?? null);
  }, [eventId]);

  useEffect(() => {
    if (open) void load();
  }, [open, load]);

  async function addOption(e: React.FormEvent) {
    e.preventDefault();
    if (!label.trim()) return;
    const res = await fetch(`/api/events/${eventId}/options`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ label: label.trim() }),
    });
    if (!res.ok) {
      toast.error("Could not add option");
      return;
    }
    toast.success("Poll choice added");
    setLabel("");
    load();
    onChanged();
  }

  async function vote(optionId: string) {
    const res = await fetch(`/api/events/${eventId}/options/vote`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ optionId }),
    });
    if (!res.ok) {
      toast.error("Vote failed");
      return;
    }
    setMyOptionId(optionId);
    load();
    onChanged();
  }

  if (!open) return null;

  return (
    <div className="paper-sheet space-y-3 p-4">
      <p className="font-display text-lg font-bold">Game / mode poll</p>
      <ul className="space-y-2">
        {options.length === 0 ? (
          <li className="text-sm text-muted-foreground">No choices yet.</li>
        ) : (
          options.map((o) => (
            <li
              key={o.id}
              className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-border/40 px-3 py-2"
            >
              <span className="font-medium">{o.label}</span>
              <span className="text-xs text-muted-foreground">{o.voteCount} votes</span>
              <Button
                type="button"
                size="sm"
                variant={myOptionId === o.id ? "default" : "outline"}
                onClick={() => vote(o.id)}
              >
                {myOptionId === o.id ? "Your pick" : "Vote"}
              </Button>
            </li>
          ))
        )}
      </ul>
      {isHost && (
        <form onSubmit={addOption} className="flex flex-wrap items-end gap-2 border-t border-border/30 pt-3">
          <div className="min-w-[10rem] flex-1 space-y-1">
            <Label htmlFor="opt-label">Add poll choice</Label>
            <Input
              id="opt-label"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="e.g. Hardcore seasonal"
            />
          </div>
          <Button type="submit" size="sm">
            Add
          </Button>
        </form>
      )}
    </div>
  );
}
