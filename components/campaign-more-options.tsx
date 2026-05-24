"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { EventOptionsPoll } from "@/components/event-options-poll";
import { EventRolesEditor } from "@/components/event-roles-editor";
import { cn } from "@/lib/utils";

type Participant = {
  userId: string;
  status: string;
  user?: { id: string; name: string | null; image: string | null } | null;
};

type CampaignMoreOptionsProps = {
  eventId: string;
  phase: string;
  isHost: boolean;
  participants: Participant[];
  onChanged: () => void;
};

export function CampaignMoreOptions({
  eventId,
  phase,
  isHost,
  participants,
  onChanged,
}: CampaignMoreOptionsProps) {
  const [open, setOpen] = useState(false);

  if (phase !== "interest" && phase !== "scheduling") return null;

  return (
    <div className="paper-panel paper-panel--inset on-paper overflow-hidden">
      <button
        type="button"
        className="flex w-full items-center gap-2 px-4 py-3 text-left hover:bg-[color-mix(in_oklch,var(--paper-cream)_88%,var(--primary)_12%)]"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
      >
        <span className="font-display text-base font-bold text-[var(--paper-ink)]">
          More options
        </span>
        <span className="font-sans text-xs font-medium text-[var(--paper-ink-muted)]">
          poll mode · roles
        </span>
        <ChevronDown
          className={cn(
            "ml-auto size-5 shrink-0 text-[var(--paper-ink)] transition-transform",
            open && "rotate-180",
          )}
        />
      </button>
      {open && (
        <div className="space-y-4 border-t border-dashed border-paper-border px-4 py-4">
          <EventOptionsPoll
            eventId={eventId}
            phase={phase}
            isHost={isHost}
            onChanged={onChanged}
          />
          <EventRolesEditor
            eventId={eventId}
            isHost={isHost}
            participants={participants}
            onChanged={onChanged}
          />
        </div>
      )}
    </div>
  );
}
