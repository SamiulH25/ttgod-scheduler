"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { formatEventWhen } from "@/lib/dates";
import { StampMotion } from "@/components/motion/stamp-pop";
import { useState } from "react";
import { toast } from "sonner";

export type PendingInviteEvent = {
  id: string;
  title: string;
  phase: string;
  start: string | null;
  end: string | null;
  proposals?: { id: string }[];
};

type PendingInvitesBannerProps = {
  events: PendingInviteEvent[];
  onResponded: (eventId: string, status: "accepted" | "declined") => void;
};

export function PendingInvitesBanner({ events, onResponded }: PendingInvitesBannerProps) {
  const [stampKeys, setStampKeys] = useState<Record<string, number>>({});
  const [busyId, setBusyId] = useState<string | null>(null);

  if (events.length === 0) return null;
  const pending = events;

  async function respond(eventId: string, status: "accepted" | "declined") {
    setBusyId(eventId);
    setStampKeys((k) => ({ ...k, [eventId]: (k[eventId] ?? 0) + 1 }));
    const res = await fetch(`/api/events/${eventId}/participation`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    setBusyId(null);
    if (!res.ok) {
      toast.error("Could not update invitation");
      return;
    }
    toast.success(status === "accepted" ? "You’re in!" : "Declined");
    onResponded(eventId, status);
  }

  return (
    <div
      className="paper-panel on-paper overflow-hidden border-2 border-primary/40"
      role="region"
      aria-label="Pending invitations"
    >
      <div className="border-b border-paper-border px-4 py-3">
        <h2 className="font-display text-lg font-bold text-[var(--paper-ink)]">
          {pending.length} invitation{pending.length === 1 ? "" : "s"} waiting
        </h2>
        <p className="text-sm text-[var(--paper-ink-muted)]">
          Accept or decline pinned sessions — or open the campaign for details.
        </p>
      </div>
      <ul className="divide-y divide-paper-border">
        {pending.map((ev) => {
          const when = formatEventWhen(
            ev.phase,
            ev.start,
            ev.end,
            ev.proposals?.length ?? 0,
          );
          const busy = busyId === ev.id;
          return (
            <li key={ev.id} className="flex flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center">
              <div className="min-w-0 flex-1">
                <p className="font-display font-bold text-[var(--paper-ink)]">{ev.title}</p>
                <p className="text-sm text-[var(--paper-ink-muted)]">{when}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <StampMotion animationKey={stampKeys[ev.id] ?? 0}>
                  <Button
                    type="button"
                    size="sm"
                    disabled={busy}
                    onClick={() => void respond(ev.id, "accepted")}
                  >
                    Accept
                  </Button>
                </StampMotion>
                <StampMotion animationKey={stampKeys[ev.id] ?? 0}>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    disabled={busy}
                    onClick={() => void respond(ev.id, "declined")}
                  >
                    Decline
                  </Button>
                </StampMotion>
                <Button type="button" size="sm" variant="ghost" asChild>
                  <Link href={`/events/${ev.id}`}>Open</Link>
                </Button>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
