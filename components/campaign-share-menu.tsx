"use client";

import { useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Share2, ClipboardList, Link2 } from "lucide-react";

type CampaignShareMenuProps = {
  eventId: string;
  isHost: boolean;
  phase: string;
};

export function CampaignShareMenu({ eventId, isHost, phase }: CampaignShareMenuProps) {
  const [open, setOpen] = useState(false);
  const [inviteUrl, setInviteUrl] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  if (phase !== "scheduled") return null;

  async function mintPublicInvite() {
    setBusy(true);
    const res = await fetch(`/api/events/${eventId}/public-invite`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });
    setBusy(false);
    if (!res.ok) {
      toast.error("Could not create invite link");
      return;
    }
    const data = (await res.json()) as { url?: string };
    if (data.url && typeof window !== "undefined") {
      const full = `${window.location.origin}${data.url}`;
      setInviteUrl(full);
      await navigator.clipboard.writeText(full);
      toast.success("Public invite link copied");
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button type="button" variant="outline" size="sm">
          <Share2 className="size-4" />
          Share
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-sm gap-0 p-0">
        <DialogHeader className="border-b border-border/60 px-4 py-3">
          <DialogTitle className="font-display text-lg">Share session</DialogTitle>
          <p className="font-sans text-xs text-muted-foreground">
            Printable card or read-only link — no bot required.
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
            <Button
              type="button"
              variant="outline"
              className="justify-start"
              disabled={busy}
              onClick={() => void mintPublicInvite()}
            >
              <Link2 className="size-4" />
              Copy public invite link
            </Button>
          )}
          {inviteUrl && (
            <p className="break-all text-xs text-muted-foreground">{inviteUrl}</p>
          )}
          <p className="text-xs text-muted-foreground">
            Squad week link: mint under Settings → Calendar &amp; alerts.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
