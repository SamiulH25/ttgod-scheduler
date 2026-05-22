"use client";

import { useCallback, useEffect, useState } from "react";
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
import { Skeleton } from "@/components/ui/skeleton";
import { formatShort } from "@/lib/dates";
import { ArrowDown, ArrowUp, ChevronLeft, Plus, Trash2 } from "lucide-react";

type PlanItem = {
  id: string;
  sortOrder: number;
  startsAt: string | null;
  title: string;
  notes: string | null;
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
      }),
    });
    if (!res.ok) {
      toast.error("Failed to add plan item");
      return;
    }
    setNewTitle("");
    setNewNotes("");
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
                    </CardTitle>
                    {item.startsAt && (
                      <p className="text-xs text-muted-foreground">
                        {formatShort(new Date(item.startsAt))}
                      </p>
                    )}
                    {item.notes && (
                      <p className="mt-1 text-sm text-muted-foreground">{item.notes}</p>
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
