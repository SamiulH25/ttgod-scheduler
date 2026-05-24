"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Link2 } from "lucide-react";

export function InvitePageCopyLink({ eventId }: { eventId: string }) {
  const [busy, setBusy] = useState(false);

  async function copyLink() {
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
      await navigator.clipboard.writeText(`${window.location.origin}${data.url}`);
      toast.success("Public invite link copied");
    }
  }

  return (
    <Button
      type="button"
      variant="outline"
      disabled={busy}
      onClick={() => void copyLink()}
    >
      <Link2 className="size-4" />
      {busy ? "Creating…" : "Copy share link"}
    </Button>
  );
}
