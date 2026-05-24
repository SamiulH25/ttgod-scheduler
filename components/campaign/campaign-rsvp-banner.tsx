"use client";

import { StampMotion } from "@/components/motion/stamp-pop";
import { Button } from "@/components/ui/button";
import { formatEventWhen } from "@/lib/dates";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { toast } from "sonner";

type CampaignRsvpBannerProps = {
  eventId: string;
  title: string;
  phase: string;
  start: string | null;
  end: string | null;
  proposalCount: number;
  className?: string;
  onUpdated: () => void;
};

export function CampaignRsvpBanner({
  eventId,
  title,
  phase,
  start,
  end,
  proposalCount,
  className,
  onUpdated,
}: CampaignRsvpBannerProps) {
  const [stampKey, setStampKey] = useState(0);
  const [busy, setBusy] = useState(false);

  if (phase !== "scheduled") return null;

  async function respond(status: "accepted" | "declined") {
    setBusy(true);
    setStampKey((k) => k + 1);
    const res = await fetch(`/api/events/${eventId}/participation`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    setBusy(false);
    if (!res.ok) {
      toast.error("Could not update your RSVP");
      return;
    }
    toast.success(status === "accepted" ? "You’re in!" : "Declined");
    onUpdated();
  }

  const when = formatEventWhen(phase, start, end, proposalCount);

  return (
    <div
      className={cn(
        "paper-panel on-paper overflow-hidden border-2 border-primary/45 bg-[color-mix(in_oklch,var(--primary)_12%,var(--paper-cream))]",
        className,
      )}
      role="region"
      aria-label="Session invitation"
    >
      <div className="px-4 py-4 sm:px-5">
        <p className="font-display text-xs font-bold uppercase tracking-wide text-primary">
          You&apos;re invited
        </p>
        <p className="mt-1 font-display text-xl font-bold text-[var(--paper-ink)]">{title}</p>
        <p className="mt-1 text-sm font-medium text-[var(--paper-ink-muted)]">{when}</p>
        <div className="mt-4 flex flex-wrap gap-2">
          <StampMotion animationKey={stampKey}>
            <Button
              type="button"
              size="lg"
              disabled={busy}
              className="min-w-[8rem] font-display"
              onClick={() => void respond("accepted")}
            >
              Accept
            </Button>
          </StampMotion>
          <StampMotion animationKey={stampKey}>
            <Button
              type="button"
              size="lg"
              variant="outline"
              disabled={busy}
              className="min-w-[8rem] font-display"
              onClick={() => void respond("declined")}
            >
              Decline
            </Button>
          </StampMotion>
        </div>
      </div>
    </div>
  );
}
