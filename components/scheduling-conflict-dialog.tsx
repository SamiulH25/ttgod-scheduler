"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { UserAvatar } from "@/components/user-avatar";

export type ConflictUser = {
  userId: string;
  name: string | null;
  image: string | null;
  status: "busy" | "tentative";
};

type SchedulingConflictDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  conflicts: ConflictUser[];
  onConfirm: () => void;
  onCancel: () => void;
};

export function SchedulingConflictDialog({
  open,
  onOpenChange,
  conflicts,
  onConfirm,
  onCancel,
}: SchedulingConflictDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Scheduling conflicts</DialogTitle>
          <p className="text-sm text-muted-foreground">
            These squad members marked busy or tentative for this slot. You can still pin the time.
          </p>
        </DialogHeader>
        <ul className="max-h-48 space-y-2 overflow-y-auto">
          {conflicts.map((c) => (
            <li key={c.userId} className="flex items-center gap-2">
              <UserAvatar name={c.name} image={c.image} size="sm" />
              <span className="font-sans text-sm">
                {c.name ?? "Member"} · <strong>{c.status}</strong>
              </span>
            </li>
          ))}
        </ul>
        <div className="flex flex-wrap justify-end gap-2 pt-2">
          <Button type="button" variant="outline" onClick={onCancel}>
            Pick another slot
          </Button>
          <Button type="button" onClick={onConfirm}>
            Pin anyway
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
