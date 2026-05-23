"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type Season = { id: string; name: string; color: string; sortOrder: number };

type EventLite = {
  id: string;
  title: string;
  createdById: string;
  seasonId: string | null;
  season: { id: string; name: string; color: string } | null;
};

export function SeasonBoard({ currentUserId }: { currentUserId: string }) {
  const [seasons, setSeasons] = useState<Season[]>([]);
  const [events, setEvents] = useState<EventLite[]>([]);
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    const [sRes, eRes] = await Promise.all([
      fetch("/api/seasons"),
      fetch("/api/events"),
    ]);
    if (sRes.ok) {
      const d = await sRes.json();
      setSeasons(d.seasons ?? []);
    }
    if (eRes.ok) {
      const d = await eRes.json();
      const all = (d.events ?? []) as EventLite[];
      setEvents(all.filter((ev) => ev.createdById === currentUserId));
    }
  }, [currentUserId]);

  useEffect(() => {
    void load();
  }, [load]);

  async function addSeason(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setBusy(true);
    const res = await fetch("/api/seasons", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: name.trim() }),
    });
    setBusy(false);
    if (!res.ok) {
      toast.error("Could not add season");
      return;
    }
    toast.success("Season added");
    setName("");
    load();
  }

  async function patchEventSeason(eventId: string, seasonId: string | null) {
    const res = await fetch(`/api/events/${eventId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ seasonId }),
    });
    if (!res.ok) {
      toast.error("Could not update campaign");
      return;
    }
    toast.success("Season updated");
    load();
  }

  return (
    <Card tiltId="season-board">
      <CardHeader>
        <CardTitle className="font-display">Season board</CardTitle>
        <p className="text-xs text-muted-foreground">
          Group campaigns into arcs (PvE season, racing league, etc.).
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <form onSubmit={addSeason} className="flex flex-wrap items-end gap-2">
          <div className="min-w-[10rem] flex-1 space-y-1">
            <Label htmlFor="season-name">New season</Label>
            <Input
              id="season-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Season name"
            />
          </div>
          <Button type="submit" size="sm" disabled={busy}>
            Add
          </Button>
        </form>

        {seasons.length > 0 && (
          <ul className="flex flex-wrap gap-2">
            {seasons.map((s) => (
              <li
                key={s.id}
                className="rounded-full border px-3 py-1 text-xs font-semibold"
                style={{ borderColor: s.color, color: s.color }}
              >
                {s.name}
              </li>
            ))}
          </ul>
        )}

        <div className="max-h-64 space-y-2 overflow-y-auto">
          {events.length === 0 ? (
            <p className="text-sm text-muted-foreground">No campaigns yet.</p>
          ) : (
            events.map((ev) => (
              <div
                key={ev.id}
                className="paper-sheet flex flex-wrap items-center justify-between gap-2 p-2 text-sm"
              >
                <span className="font-display font-bold">{ev.title}</span>
                <select
                  className="h-9 rounded-md border border-input bg-background px-2 text-xs"
                  value={ev.seasonId ?? ""}
                  onChange={(e) => {
                    const v = e.target.value;
                    void patchEventSeason(ev.id, v === "" ? null : v);
                  }}
                >
                  <option value="">No season</option>
                  {seasons.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}
