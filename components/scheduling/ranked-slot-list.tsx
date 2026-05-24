"use client";

import Link from "next/link";
import { formatProposalRange } from "@/lib/dates";
import { formatTime24 } from "@/lib/calendar";
import { CopyPingButton } from "@/components/copy-ping-button";
import { UserAvatar } from "@/components/user-avatar";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/status-badge";
import { cn } from "@/lib/utils";

export type RankedSlotRow = {
  start: string;
  end: string;
  overlapCount: number;
  userIds: string[];
  score: number;
  reasons: string[];
};

type UserLookup = { id: string; name: string | null; image: string | null };

type RankedSlotListProps = {
  slots: RankedSlotRow[];
  usersById?: Map<string, UserLookup>;
  rosterSize?: number;
  busy?: boolean;
  highlightTop?: number;
  onAddToPoll?: (start: string, end: string) => void;
  onPin?: (start: string, end: string) => void;
  onHold?: (start: string, end: string) => void;
  campaignHref?: (start: string, end: string) => string;
  emptyMessage?: string;
  className?: string;
};

export function RankedSlotList({
  slots,
  usersById,
  rosterSize,
  busy,
  highlightTop = 3,
  onAddToPoll,
  onPin,
  onHold,
  campaignHref,
  emptyMessage = "No overlapping slots in this range.",
  className,
}: RankedSlotListProps) {
  if (slots.length === 0) {
    return (
      <p className={cn("text-sm text-muted-foreground", className)}>{emptyMessage}</p>
    );
  }

  const maxScore = Math.max(...slots.map((s) => s.score), 1);

  return (
    <ul className={cn("space-y-2", className)}>
      {slots.map((slot, i) => {
        const people =
          slot.userIds
            .map((id) => usersById?.get(id))
            .filter((u): u is UserLookup => Boolean(u)) ?? [];
        const pingPeople = people.map((p) => ({ name: p.name }));
        const isTop = i < highlightTop;

        return (
          <li
            key={`${slot.start}-${slot.end}`}
            className={cn(
              "paper-sheet space-y-2 px-3 py-2",
              isTop && "ring-1 ring-primary/25",
            )}
          >
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div className="min-w-0 flex-1">
                <p className="font-display font-bold">
                  {formatProposalRange(slot.start, slot.end)}
                </p>
                <p className="text-xs text-muted-foreground">
                  {formatTime24(new Date(slot.start))} window
                </p>
                <div className="mt-2 flex flex-wrap gap-1">
                  {slot.reasons.slice(0, 3).map((r) => (
                    <StatusBadge key={r} variant="muted" className="text-[10px]">
                      {r}
                    </StatusBadge>
                  ))}
                </div>
              </div>
              <div className="flex flex-col items-end gap-1">
                <div className="flex -space-x-1.5">
                  {people.slice(0, 6).map((u) => (
                    <UserAvatar
                      key={u.id}
                      name={u.name}
                      image={u.image}
                      size="sm"
                    />
                  ))}
                </div>
                {rosterSize != null && (
                  <span className="text-[10px] tabular-nums text-muted-foreground">
                    score {slot.score}
                  </span>
                )}
                <div
                  className="h-1 w-16 overflow-hidden rounded-full bg-muted"
                  title="Match score"
                >
                  <div
                    className="h-full bg-primary/70"
                    style={{ width: `${Math.round((slot.score / maxScore) * 100)}%` }}
                  />
                </div>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {onAddToPoll && (
                <Button
                  type="button"
                  size="sm"
                  disabled={busy}
                  onClick={() => onAddToPoll(slot.start, slot.end)}
                >
                  Add to poll
                </Button>
              )}
              {onPin && (
                <Button
                  type="button"
                  size="sm"
                  variant="secondary"
                  disabled={busy}
                  onClick={() => onPin(slot.start, slot.end)}
                >
                  Pin time
                </Button>
              )}
              {onHold && (
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  disabled={busy}
                  onClick={() => onHold(slot.start, slot.end)}
                >
                  Hold window
                </Button>
              )}
              {campaignHref && (
                <Button type="button" size="sm" variant="outline" asChild>
                  <Link href={campaignHref(slot.start, slot.end)}>
                    Start campaign
                  </Link>
                </Button>
              )}
              <CopyPingButton
                title="Squad session"
                start={slot.start}
                end={slot.end}
                people={pingPeople}
              />
            </div>
          </li>
        );
      })}
    </ul>
  );
}
