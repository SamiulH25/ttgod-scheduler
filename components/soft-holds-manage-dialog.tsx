"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { SoftHoldsPanel } from "@/components/soft-holds-panel";

export function SoftHoldsManageDialog({
  currentUserId,
  triggerLabel = "Manage holds",
}: {
  currentUserId: string;
  triggerLabel?: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button type="button" variant="ghost" size="sm" className="font-sans text-xs">
          {triggerLabel}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg gap-0 p-0">
        <DialogHeader className="border-b border-paper-border/60 px-4 py-3">
          <DialogTitle className="font-display text-lg">Soft holds</DialogTitle>
          <p className="font-sans text-xs text-muted-foreground">
            Pencil a window before it becomes a campaign.
          </p>
        </DialogHeader>
        <div className="max-h-[70vh] overflow-y-auto p-2">
          <SoftHoldsPanel currentUserId={currentUserId} />
        </div>
      </DialogContent>
    </Dialog>
  );
}
