"use client";

import { useCallback, useEffect, useState } from "react";
import { StatusBadge } from "@/components/status-badge";
import { UserAvatar } from "@/components/user-avatar";
import { cn } from "@/lib/utils";

export type SlotFreeUser = {
  userId: string;
  name: string | null;
  image: string | null;
};

function toIso(value: string | Date): string {
  return value instanceof Date ? value.toISOString() : new Date(value).toISOString();
}

type SlotFreeUsersProps = {
  start: string | Date | null | undefined;
  end: string | Date | null | undefined;
  /** Use event-scoped route when scheduling on an existing campaign */
  eventId?: string;
  compact?: boolean;
  className?: string;
  /** Shown under the compact line (e.g. timezone caption) */
  timezoneLabel?: string | null;
};

export function SlotFreeUsers({
  start,
  end,
  eventId,
  compact = false,
  className,
  timezoneLabel,
}: SlotFreeUsersProps) {
  const [users, setUsers] = useState<SlotFreeUser[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchFree = useCallback(async () => {
    if (!start || !end) {
      setUsers([]);
      return;
    }
    const startDate = new Date(toIso(start));
    const endDate = new Date(toIso(end));
    if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
      setUsers([]);
      return;
    }
    if (endDate <= startDate) {
      setUsers([]);
      return;
    }

    setLoading(true);
    const params = new URLSearchParams({
      start: startDate.toISOString(),
      end: endDate.toISOString(),
    });
    const path = eventId
      ? `/api/events/${eventId}/free-users?${params}`
      : `/api/events/free-users?${params}`;
    try {
      const res = await fetch(path);
      if (res.ok) {
        const data = await res.json();
        setUsers(data.notifyTargets ?? []);
      } else {
        setUsers([]);
      }
    } catch {
      setUsers([]);
    } finally {
      setLoading(false);
    }
  }, [start, end, eventId]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void fetchFree();
    }, 280);
    return () => window.clearTimeout(timer);
  }, [fetchFree]);

  if (!start || !end) return null;

  if (compact) {
    if (loading) {
      return (
        <p className={cn("text-xs text-muted-foreground", className)}>
          Checking who can go…
        </p>
      );
    }
    if (users.length === 0) {
      return (
        <p className={cn("text-xs text-muted-foreground", className)}>
          No squad availability for this slot
        </p>
      );
    }
    return (
      <div className={cn("flex flex-wrap items-center gap-1.5", className)}>
        <StatusBadge variant="overlap" className="px-1.5 py-0 text-[10px]">
          {users.length} can go
        </StatusBadge>
        <div className="flex -space-x-1">
          {users.slice(0, 6).map((u) => (
            <UserAvatar
              key={u.userId}
              name={u.name}
              image={u.image}
              size="xs"
              className="ring-1 ring-[var(--paper-cream)]"
            />
          ))}
        </div>
        <span className="text-xs text-[var(--paper-ink-muted)]">
          {users
            .slice(0, 4)
            .map((u) => u.name?.split(" ")[0] ?? "Member")
            .join(", ")}
          {users.length > 4 ? ` +${users.length - 4}` : ""}
        </span>
        {timezoneLabel ? (
          <span className="w-full text-[10px] text-[var(--paper-ink-muted)]">
            {timezoneLabel}
          </span>
        ) : null}
      </div>
    );
  }

  return (
    <div
      className={cn(
        "rounded-lg border border-border/60 bg-muted/30 px-3 py-2",
        className,
      )}
    >
      {loading ? (
        <p className="text-xs text-muted-foreground">Checking who can go…</p>
      ) : users.length > 0 ? (
        <div className="space-y-2">
          <StatusBadge variant="overlap">
            {users.length} squad {users.length === 1 ? "member" : "members"} can
            go at this time
          </StatusBadge>
          <div className="flex flex-wrap items-center gap-2">
            {users.map((u) => (
              <span
                key={u.userId}
                className="inline-flex items-center gap-1 rounded-sm border border-[var(--crayon-stroke)]/30 bg-[var(--paper-cream)] px-1.5 py-0.5"
              >
                <UserAvatar name={u.name} image={u.image} size="xs" />
                <span className="font-display text-xs font-bold">
                  {u.name ?? "Member"}
                </span>
              </span>
            ))}
          </div>
        </div>
      ) : (
        <p className="text-xs text-muted-foreground">
          No one has posted availability for this time yet.
        </p>
      )}
    </div>
  );
}
