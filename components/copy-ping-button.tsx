"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Copy } from "lucide-react";
import { buildCopyPingList } from "@/lib/copy-ping-list";

type CopyPingButtonProps = {
  title?: string;
  start: Date | string;
  end: Date | string;
  people: { name: string | null }[];
  className?: string;
};

export function CopyPingButton({
  title,
  start,
  end,
  people,
  className,
}: CopyPingButtonProps) {
  const [busy, setBusy] = useState(false);

  async function copy() {
    const s = new Date(start);
    const e = new Date(end);
    if (Number.isNaN(s.getTime()) || Number.isNaN(e.getTime())) {
      toast.error("Invalid time range");
      return;
    }
    setBusy(true);
    const text = buildCopyPingList({ title, start: s, end: e, people });
    try {
      await navigator.clipboard.writeText(text);
      toast.success("Copied ping list");
    } catch {
      toast.error("Could not copy");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Button
      type="button"
      size="sm"
      variant="outline"
      className={className}
      disabled={busy}
      onClick={() => void copy()}
    >
      <Copy className="size-3.5" />
      Copy ping
    </Button>
  );
}
