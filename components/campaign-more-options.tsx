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
    <div className="rounded-sm border border-dashed border-border/60">
      <button
        type="button"
        className="flex w-full items-center justify-between gap-2 px-4 py-3 text-left font-display text-lg font-bold"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
      >
        More options
        <span className="font-sans text-xs font-normal text-muted-foreground">
          mode poll, roles
        </span>
        <ChevronDown
          className={cn("size-5 shrink-0 transition-transform", open && "rotate-180")}
        />
      </button>
      {open && (
        <div className="space-y-4 border-t border-dashed border-border/60 p-4">
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
