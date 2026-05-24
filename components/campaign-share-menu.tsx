"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Share2, ClipboardList } from "lucide-react";

type CampaignShareMenuProps = {
  eventId: string;
  isHost: boolean;
  phase: string;
};

/** Pinned-session extras — invite link lives in Invite the squad panel. */
export function CampaignShareMenu({ eventId, isHost, phase }: CampaignShareMenuProps) {
  const [open, setOpen] = useState(false);

  if (phase !== "scheduled") return null;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button type="button" variant="outline" size="sm">
          <Share2 className="size-4" />
          Share
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-sm gap-0 p-0">
        <DialogHeader className="border-b border-paper-border/60 px-4 py-3">
          <DialogTitle className="font-display text-lg">Share pinned session</DialogTitle>
          <p className="font-sans text-xs text-muted-foreground">
            Printable card for the wall, or use the invite link in the sidebar.
          </p>
        </DialogHeader>
        <div className="flex flex-col gap-2 p-4 font-sans">
          <Button asChild variant="secondary" className="justify-start">
            <Link href={`/events/${eventId}/invite`} onClick={() => setOpen(false)}>
              <ClipboardList className="size-4" />
              Printable invite
            </Link>
          </Button>
          {isHost && (
            <Button asChild variant="outline" className="justify-start">
              <Link href={`/events/${eventId}#campaign-invites`} onClick={() => setOpen(false)}>
                <Share2 className="size-4" />
                Copy invite link
              </Link>
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
