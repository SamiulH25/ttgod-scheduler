"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type HoldRow = {
  id: string;
  title: string;
  start: string;
  end: string;
  expiresAt: string;
  createdBy: { id: string; name: string | null; image: string | null };
};

export async function createSoftHoldFromOverlap(
  holdTitle: string,
  startIso: string,
  endIso: string,
) {
  const res = await fetch("/api/soft-holds", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      title: holdTitle.trim() || "Squad overlap",
      start: startIso,
      end: endIso,
    }),
  });
  if (!res.ok) {
    toast.error("Could not create soft hold");
    return;
  }
  toast.success("Soft hold saved");
}

export function SoftHoldsPanel({ currentUserId }: { currentUserId: string }) {
  const [holds, setHolds] = useState<HoldRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState("Tentative session");
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/soft-holds");
    setLoading(false);
    if (!res.ok) return;
    const data = await res.json();
    setHolds(data.holds ?? []);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function createHold(e: React.FormEvent) {
    e.preventDefault();
    if (!start || !end) {
      toast.error("Pick start and end");
      return;
    }
    setBusy(true);
    const res = await fetch("/api/soft-holds", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: title.trim() || "Soft hold",
        start: new Date(start).toISOString(),
        end: new Date(end).toISOString(),
      }),
    });
    setBusy(false);
    if (!res.ok) {
      toast.error("Could not create hold");
      return;
    }
    toast.success("Soft hold posted");
    setTitle("Tentative session");
    setStart("");
    setEnd("");
    load();
  }

  async function remove(id: string) {
    const res = await fetch(`/api/soft-holds/${id}`, { method: "DELETE" });
    if (!res.ok) {
      toast.error("Could not remove");
      return;
    }
    toast.success("Hold removed");
    load();
  }

  async function convert(id: string) {
    const res = await fetch(`/api/soft-holds/${id}/convert`, { method: "POST" });
    if (!res.ok) {
      toast.error("Could not convert");
      return;
    }
    const data = await res.json();
    toast.success("Campaign created");
    if (data.eventId) {
      window.location.href = `/events/${data.eventId}`;
    }
  }

  return (
    <Card tiltId="soft-holds" className="h-full">
      <CardHeader>
        <CardTitle className="font-display text-xl">Soft holds</CardTitle>
        <p className="text-xs text-muted-foreground">
          Pencil a window before it becomes a campaign. Holds expire automatically.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <form onSubmit={createHold} className="space-y-2">
          <div className="space-y-1">
            <Label htmlFor="hold-title">Title</Label>
            <Input
              id="hold-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={200}
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <Label htmlFor="hold-start">Start</Label>
              <Input
                id="hold-start"
                type="datetime-local"
                value={start}
                onChange={(e) => setStart(e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="hold-end">End</Label>
              <Input
                id="hold-end"
                type="datetime-local"
                value={end}
                onChange={(e) => setEnd(e.target.value)}
              />
            </div>
          </div>
          <Button type="submit" size="sm" disabled={busy}>
            Add hold
          </Button>
        </form>

        {loading ? (
          <p className="text-sm text-muted-foreground">Loading…</p>
        ) : holds.length === 0 ? (
          <p className="text-sm text-muted-foreground">No active holds.</p>
        ) : (
          <ul className="space-y-2">
            {holds.map((h) => (
              <li key={h.id} className="paper-sheet flex flex-col gap-2 p-3 text-sm">
                <p className="font-display font-bold">{h.title}</p>
                <p className="text-xs text-muted-foreground">
                  Until {new Date(h.expiresAt).toLocaleString()}
                </p>
                <div className="flex flex-wrap gap-2">
                  <Button type="button" size="sm" variant="secondary" onClick={() => convert(h.id)}>
                    Convert to campaign
                  </Button>
                  <Button type="button" size="sm" variant="outline" asChild>
                    <Link
                      href={`/events?start=${encodeURIComponent(h.start)}&end=${encodeURIComponent(h.end)}`}
                    >
                      Plan event
                    </Link>
                  </Button>
                  {h.createdBy.id === currentUserId && (
                    <Button type="button" size="sm" variant="ghost" onClick={() => remove(h.id)}>
                      Remove
                    </Button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
