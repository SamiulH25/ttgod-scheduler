"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { motion } from "motion/react";
import Link from "next/link";
import { PageContainer } from "@/components/layout/page-container";
import { useReducedMotion } from "@/lib/use-reduced-motion";
import { toast } from "sonner";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { rollupPackListFromPlanItems } from "@/lib/pack-list";
import { Skeleton } from "@/components/ui/skeleton";
import { formatShort } from "@/lib/dates";
import { ArrowDown, ArrowUp, ChevronLeft, Plus, Trash2 } from "lucide-react";

function parseChecklistRows(
  raw: string | null,
): { label: string; done: boolean }[] {
  if (!raw?.trim()) return [];
  try {
    const j = JSON.parse(raw) as unknown;
    if (!Array.isArray(j)) return [];
    return j
      .map((row) => {
        if (!row || typeof row !== "object") return null;
        const o = row as Record<string, unknown>;
        const label = typeof o.label === "string" ? o.label : "";
        const done = Boolean(o.done);
        if (!label) return null;
        return { label, done };
      })
      .filter((x): x is { label: string; done: boolean } => x != null);
  } catch {
    return [];
  }
}

type PlanItem = {
  id: string;
  sortOrder: number;
  startsAt: string | null;
  title: string;
  notes: string | null;
  url: string | null;
  checklist: string | null;
  kind: string;
  location: string | null;
};

type EventItineraryProps = {
  eventId: string;
  eventTitle: string;
  eventStart: string;
  eventEnd: string;
  isHost: boolean;
};

export function EventItinerary({
  eventId,
  eventTitle,
  eventStart,
  eventEnd,
  isHost,
}: EventItineraryProps) {
  const [items, setItems] = useState<PlanItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [newTitle, setNewTitle] = useState("");
  const [newNotes, setNewNotes] = useState("");
  const [newUrl, setNewUrl] = useState("");
  const [newChecklist, setNewChecklist] = useState("");
  const [newKind, setNewKind] = useState("step");
  const [newLocation, setNewLocation] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch(`/api/events/${eventId}/itinerary`);
    setLoading(false);
    if (!res.ok) {
      toast.error("Failed to load itinerary");
      return;
    }
    const data = await res.json();
    setItems(data.items);
  }, [eventId]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!isHost) return;
    const res = await fetch(`/api/events/${eventId}/itinerary`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: newTitle,
        notes: newNotes || undefined,
        url: newUrl.trim() || undefined,
        checklist: newChecklist.trim() || undefined,
        kind: newKind,
        location: newLocation.trim() || undefined,
      }),
    });
    if (!res.ok) {
      toast.error("Failed to add plan item");
      return;
    }
    setNewTitle("");
    setNewNotes("");
    setNewUrl("");
    setNewChecklist("");
    setNewKind("step");
    setNewLocation("");
    toast.success("Added to itinerary");
    load();
  }

  async function handleDelete(itemId: string) {
    const res = await fetch(`/api/events/${eventId}/itinerary/${itemId}`, {
      method: "DELETE",
    });
    if (!res.ok) {
      toast.error("Failed to remove item");
      return;
    }
    load();
  }

  async function moveItem(item: PlanItem, direction: "up" | "down") {
    const sorted = [...items].sort((a, b) => a.sortOrder - b.sortOrder);
    const idx = sorted.findIndex((i) => i.id === item.id);
    const swapIdx = direction === "up" ? idx - 1 : idx + 1;
    if (swapIdx < 0 || swapIdx >= sorted.length) return;

    const other = sorted[swapIdx]!;
    await Promise.all([
      fetch(`/api/events/${eventId}/itinerary/${item.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sortOrder: other.sortOrder }),
      }),
      fetch(`/api/events/${eventId}/itinerary/${other.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sortOrder: item.sortOrder }),
      }),
    ]);
    load();
  }

  const sorted = [...items].sort((a, b) => a.sortOrder - b.sortOrder);
  const packLines = useMemo(
    () =>
      rollupPackListFromPlanItems(
        sorted.map((i) => ({
          kind: i.kind ?? "step",
          title: i.title,
          checklist: i.checklist,
        })),
      ),
    [sorted],
  );
  const reduced = useReducedMotion();

  return (
    <PageContainer variant="default">
    <div className="space-y-6">
      <PageHeader
        title={eventTitle}
        subtitle={`${formatShort(new Date(eventStart))} – ${formatShort(new Date(eventEnd))} · Session itinerary`}
        action={
          <Button variant="outline" asChild>
            <Link href="/events">
              <ChevronLeft className="h-4 w-4" />
              Back to events
            </Link>
          </Button>
        }
      />

      {!loading && packLines.length > 0 && (
        <Card tiltId="pack-rollup" tape>
          <CardHeader>
            <CardTitle className="font-display text-base">Pack list rollup</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="list-inside list-disc space-y-1 text-sm">
              {packLines.map((line) => (
                <li key={line}>{line}</li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {loading ? (
        <div className="space-y-3">
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
        </div>
      ) : sorted.length === 0 && !isHost ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            No plans added yet. Check back later.
          </CardContent>
        </Card>
      ) : (
        <ol className="relative space-y-0 border-l-[3px] border-dashed border-[var(--ink-pencil)] pl-8">
          {sorted.map((item, index) => (
            <motion.li
              key={item.id}
              layout={!reduced}
              className="relative pb-6 last:pb-0"
            >
              <span
                className="absolute -left-8 top-2 flex h-8 w-8 -translate-x-1/2 items-center justify-center border-[3px] border-[var(--crayon-stroke)] bg-[var(--paper-cream)] font-display text-sm font-bold tabular-nums text-primary"
                aria-hidden
              >
                {index + 1}
              </span>
              <Card tiltId={item.id} tape interactive>
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <CardTitle className="font-display text-base">
                      {item.title}
                      <span className="ml-2 text-xs font-normal uppercase text-muted-foreground">
                        {item.kind ?? "step"}
                      </span>
                    </CardTitle>
                    {item.location && (
                      <p className="text-xs font-semibold text-primary">
                        📍 {item.location}
                      </p>
                    )}
                    {item.startsAt && (
                      <p className="text-xs text-muted-foreground">
                        {formatShort(new Date(item.startsAt))}
                      </p>
                    )}
                    {item.notes && (
                      <p className="mt-1 text-sm text-muted-foreground">{item.notes}</p>
                    )}
                    {item.url && (
                      <a
                        href={item.url}
                        target="_blank"
                        rel="noreferrer"
                        className="mt-1 inline-block text-sm font-semibold text-primary underline"
                      >
                        Open link
                      </a>
                    )}
                    {parseChecklistRows(item.checklist).length > 0 && (
                      <ul className="mt-2 space-y-1 border-t border-dashed border-border/60 pt-2">
                        {parseChecklistRows(item.checklist).map((row, i) => (
                          <li key={i} className="flex items-center gap-2 text-sm">
                            <input
                              type="checkbox"
                              checked={row.done}
                              readOnly
                              className="accent-primary"
                              aria-label={row.label}
                            />
                            <span>{row.label}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                  {isHost && (
                    <div className="flex shrink-0 gap-1">
                      <Button
                        type="button"
                        size="icon"
                        variant="ghost"
                        disabled={index === 0}
                        onClick={() => moveItem(item, "up")}
                        aria-label="Move up"
                      >
                        <ArrowUp className="h-4 w-4" />
                      </Button>
                      <Button
                        type="button"
                        size="icon"
                        variant="ghost"
                        disabled={index === sorted.length - 1}
                        onClick={() => moveItem(item, "down")}
                        aria-label="Move down"
                      >
                        <ArrowDown className="h-4 w-4" />
                      </Button>
                      <Button
                        type="button"
                        size="icon"
                        variant="ghost"
                        onClick={() => handleDelete(item.id)}
                        aria-label="Delete"
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  )}
                </div>
              </CardHeader>
            </Card>
            </motion.li>
          ))}
        </ol>
      )}

      {isHost && (
        <Card>
          <CardHeader>
            <CardTitle className="font-display text-base">Add plan step</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleAdd} className="space-y-3">
              <div className="space-y-2">
                <Label htmlFor="plan-kind">Kind</Label>
                <Select value={newKind} onValueChange={setNewKind}>
                  <SelectTrigger id="plan-kind">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="step">Step</SelectItem>
                    <SelectItem value="ride">Ride / travel</SelectItem>
                    <SelectItem value="pack">Pack</SelectItem>
                    <SelectItem value="meal">Meal</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="plan-location">Location (optional)</Label>
                <Input
                  id="plan-location"
                  placeholder="Address or map hint"
                  value={newLocation}
                  onChange={(e) => setNewLocation(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="plan-title">What&apos;s happening</Label>
                <Input
                  id="plan-title"
                  required
                  placeholder="e.g. Meet in voice chat"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="plan-notes">Details (optional)</Label>
                <Input
                  id="plan-notes"
                  placeholder="Location, links, gear notes…"
                  value={newNotes}
                  onChange={(e) => setNewNotes(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="plan-url">URL (optional)</Label>
                <Input
                  id="plan-url"
                  placeholder="https://…"
                  value={newUrl}
                  onChange={(e) => setNewUrl(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="plan-checklist">Checklist JSON (optional)</Label>
                <Input
                  id="plan-checklist"
                  placeholder='[{"label":"Packs","done":false}]'
                  value={newChecklist}
                  onChange={(e) => setNewChecklist(e.target.value)}
                />
              </div>
              <Button type="submit">
                <Plus className="h-4 w-4" />
                Add step
              </Button>
            </form>
          </CardContent>
        </Card>
      )}
    </div>
    </PageContainer>
  );
}
