"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import {
  Calendar,
  ClipboardList,
  ListChecks,
  Users,
} from "lucide-react";
import { EmptyState } from "@/components/empty-state";
import { StickyNote } from "@/components/paper/sticky-note";
import { StaggerChildren, StaggerItem } from "@/components/motion/stagger-children";
import { StatusBadge } from "@/components/status-badge";
import { UserAvatar } from "@/components/user-avatar";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { formatShort, toLocalDatetimeInputValue } from "@/lib/dates";
import { stickyColorForId } from "@/lib/sticky-colors";
import { cn } from "@/lib/utils";

type SquadUser = {
  id: string;
  name: string | null;
  image: string | null;
};

type FreeUser = SquadUser & { userId: string };

type EventRow = {
  id: string;
  title: string;
  description: string | null;
  start: string;
  end: string;
  createdById: string;
  createdBy: SquadUser;
  participants: {
    userId: string;
    status: string;
    user: SquadUser;
  }[];
};

type EventsManagerProps = {
  currentUserId: string;
  presetStart?: string;
  presetEnd?: string;
};

export function EventsManager({
  currentUserId,
  presetStart,
  presetEnd,
}: EventsManagerProps) {
  const [events, setEvents] = useState<EventRow[]>([]);
  const [users, setUsers] = useState<SquadUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [participantUserIds, setParticipantUserIds] = useState<string[]>([]);
  const [freeUsers, setFreeUsers] = useState<FreeUser[]>([]);
  const [checkingFree, setCheckingFree] = useState(false);
  const [presetApplied, setPresetApplied] = useState(false);
  const [lastCreatedId, setLastCreatedId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const [eventsRes, usersRes] = await Promise.all([
      fetch("/api/events"),
      fetch("/api/users"),
    ]);
    if (eventsRes.ok) {
      const data = await eventsRes.json();
      setEvents(data.events ?? []);
    }
    if (usersRes.ok) {
      const data = await usersRes.json();
      setUsers(data.users ?? []);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (presetApplied || !presetStart || !presetEnd) return;
    setStart(toLocalDatetimeInputValue(new Date(presetStart)));
    setEnd(toLocalDatetimeInputValue(new Date(presetEnd)));
    setTitle("Squad session");
    setCreateOpen(true);
    setPresetApplied(true);
  }, [presetStart, presetEnd, presetApplied]);

  const fetchFreeUsers = useCallback(async (startVal: string, endVal: string) => {
    if (!startVal || !endVal) {
      setFreeUsers([]);
      return;
    }
    const startDate = new Date(startVal);
    const endDate = new Date(endVal);
    if (endDate <= startDate) {
      setFreeUsers([]);
      return;
    }
    setCheckingFree(true);
    const params = new URLSearchParams({
      start: startDate.toISOString(),
      end: endDate.toISOString(),
    });
    const res = await fetch(`/api/events/free-users?${params}`);
    setCheckingFree(false);
    if (res.ok) {
      const data = await res.json();
      setFreeUsers(data.notifyTargets ?? []);
    }
  }, []);

  useEffect(() => {
    if (!createOpen) return;
    const timer = setTimeout(() => fetchFreeUsers(start, end), 300);
    return () => clearTimeout(timer);
  }, [start, end, createOpen, fetchFreeUsers]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch("/api/events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title,
        description: description || undefined,
        start: new Date(start).toISOString(),
        end: new Date(end).toISOString(),
        participantUserIds,
      }),
    });
    if (!res.ok) {
      const err = await res.json();
      toast.error(err.error ?? "Failed to create event");
      return;
    }
    const data = await res.json();
    const freeCount = data.notifyTargets?.length ?? 0;
    toast.success(
      freeCount > 0
        ? `Session pinned — ${freeCount} squad free (bot can ping them)`
        : "Session pinned",
    );
    setLastCreatedId(data.event.id);
    setCreateOpen(false);
    setTitle("");
    setDescription("");
    setStart("");
    setEnd("");
    setParticipantUserIds([]);
    setFreeUsers([]);
    load();
    fetch("/api/user/onboarding", { method: "PATCH" }).catch(() => {});
  }

  async function respond(eventId: string, status: "accepted" | "declined") {
    const res = await fetch(`/api/events/${eventId}/participation`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    if (!res.ok) {
      toast.error("Failed to update invitation");
      return;
    }
    toast.success(status === "accepted" ? "You're in!" : "Declined invite");
    load();
  }

  function toggleParticipant(userId: string) {
    setParticipantUserIds((prev) =>
      prev.includes(userId)
        ? prev.filter((id) => id !== userId)
        : [...prev, userId],
    );
  }

  function addAllFree() {
    const ids = freeUsers
      .map((u) => u.userId)
      .filter((id) => id !== currentUserId);
    setParticipantUserIds((prev) => [...new Set([...prev, ...ids])]);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-end gap-2">
        {lastCreatedId && (
          <Button variant="outline" asChild>
            <Link href={`/events/${lastCreatedId}/plans`}>
              <ClipboardList className="size-4" />
              Open last itinerary
            </Link>
          </Button>
        )}
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button variant="default">Pin new event</Button>
          </DialogTrigger>
          <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
            <DialogHeader>
              <DialogTitle className="font-display">New squad sticky</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreate} className="space-y-6">
              <section className="space-y-3">
                <h3 className="prose-label text-primary">When</h3>
                <div className="space-y-2">
                  <Label htmlFor="title">Event title</Label>
                  <Input
                    id="title"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="ev-start">Start</Label>
                    <Input
                      id="ev-start"
                      type="datetime-local"
                      required
                      value={start}
                      onChange={(e) => setStart(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="ev-end">End</Label>
                    <Input
                      id="ev-end"
                      type="datetime-local"
                      required
                      value={end}
                      onChange={(e) => setEnd(e.target.value)}
                    />
                  </div>
                </div>
                <div className="rounded-lg border border-border/60 bg-muted/30 px-3 py-2">
                  {checkingFree ? (
                    <p className="text-xs text-muted-foreground">
                      Checking who&apos;s free…
                    </p>
                  ) : freeUsers.length > 0 ? (
                    <div className="space-y-2">
                      <StatusBadge variant="overlap">
                        {freeUsers.length} squad free at this time
                      </StatusBadge>
                      <div className="flex flex-wrap gap-1">
                        {freeUsers.slice(0, 8).map((u) => (
                          <UserAvatar
                            key={u.userId}
                            name={u.name}
                            image={u.image}
                            size="xs"
                          />
                        ))}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Bot can ping everyone free when the event is saved.
                      </p>
                    </div>
                  ) : start && end ? (
                    <p className="text-xs text-muted-foreground">
                      No availability overlaps this slot yet.
                    </p>
                  ) : null}
                </div>
              </section>

              <section className="space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="prose-label text-primary">Who</h3>
                  {freeUsers.length > 0 && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={addAllFree}
                    >
                      <Users className="size-3" />
                      Add all free
                    </Button>
                  )}
                </div>
                {users.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {users.map((u) => (
                      <Button
                        key={u.id}
                        type="button"
                        size="sm"
                        variant={
                          participantUserIds.includes(u.id)
                            ? "default"
                            : "outline"
                        }
                        onClick={() => toggleParticipant(u.id)}
                      >
                        {u.name ?? "User"}
                      </Button>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    No other squad members yet.
                  </p>
                )}
              </section>

              <section className="space-y-2">
                <h3 className="prose-label text-primary">Plans</h3>
                <p className="text-sm text-muted-foreground">
                  After pinning, open the itinerary to add run-of-show notes.
                </p>
                <div className="space-y-2">
                  <Label htmlFor="description">Short summary (optional)</Label>
                  <Input
                    id="description"
                    placeholder="One-line note for the sticky"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                  />
                </div>
              </section>

              <Button type="submit" variant="default" className="w-full">
                Pin to board
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="bg-bulletin-board relative overflow-hidden p-5 sm:p-8 md:p-10">
        <p className="relative z-10 mb-6 font-display text-2xl font-bold text-white drop-shadow-sm sm:text-3xl">
          Squad bulletin
        </p>

        {loading ? (
          <div className="relative z-10 space-y-4">
            <Skeleton className="h-40 w-full max-w-sm bg-white/20" />
            <Skeleton className="h-40 w-full max-w-sm bg-white/20" />
          </div>
        ) : events.length === 0 ? (
          <div className="relative z-10 flex min-h-[260px] items-center justify-center">
            <StickyNote
              tiltId="empty-board"
              backgroundColor="oklch(0.94 0.14 95)"
              className="max-w-md"
            >
              <EmptyState
                icon={Calendar}
                title="Board's empty"
                description="Create a session from the hub overlap widget or pin one here."
                action={
                  <Button variant="default" onClick={() => setCreateOpen(true)}>
                    Pin first event
                  </Button>
                }
                className="border-0 bg-transparent p-0 shadow-none [&_.paper-sheet]:shadow-none"
              />
            </StickyNote>
          </div>
        ) : (
          <StaggerChildren className="relative z-10 grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
            {events.map((ev) => {
              const colors = stickyColorForId(ev.id);
              const mine = ev.participants.find(
                (p) => p.user.id === currentUserId,
              );
              const isHost = ev.createdById === currentUserId;
              const invitePending =
                mine?.status === "pending" && !isHost;

              return (
                <StaggerItem key={ev.id}>
                  <StickyNote
                    tiltId={ev.id}
                    backgroundColor={colors.bg}
                    inkColor={colors.ink}
                    interactive
                    className="flex min-h-[200px] flex-col"
                  >
                    <div className="flex items-start gap-2">
                      <UserAvatar
                        name={ev.createdBy.name}
                        image={ev.createdBy.image}
                        size="sm"
                      />
                      <div className="min-w-0 flex-1">
                        <h3 className="font-display text-xl font-bold leading-tight">
                          {ev.title}
                        </h3>
                        <p className="mt-1 text-sm font-semibold opacity-90">
                          {formatShort(new Date(ev.start))} –{" "}
                          {formatShort(new Date(ev.end))}
                        </p>
                      </div>
                    </div>

                    {ev.description ? (
                      <p className="mt-3 line-clamp-4 text-sm leading-snug">
                        {ev.description}
                      </p>
                    ) : null}

                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      <div className="flex -space-x-1">
                        {ev.participants.slice(0, 5).map((p) => (
                          <UserAvatar
                            key={p.user.id}
                            name={p.user.name}
                            image={p.user.image}
                            size="xs"
                            className="ring-2 ring-[var(--sticky-bg)]"
                          />
                        ))}
                      </div>
                      <span className="text-xs opacity-80">
                        {ev.participants.length} invited · Host:{" "}
                        {ev.createdBy.name ?? "Unknown"}
                      </span>
                    </div>

                    {invitePending && (
                      <div className="mt-3 flex flex-wrap gap-2">
                        <Button
                          size="sm"
                          variant="default"
                          className="h-8 bg-white/40 text-xs"
                          onClick={() => respond(ev.id, "accepted")}
                        >
                          Accept
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-8 bg-white/30 text-xs"
                          onClick={() => respond(ev.id, "declined")}
                        >
                          Decline
                        </Button>
                      </div>
                    )}

                    <div className="mt-auto flex justify-end pt-4">
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 border-[var(--sticky-ink)]/30 bg-white/40 text-xs"
                        asChild
                      >
                        <Link href={`/events/${ev.id}/plans`}>
                          <ListChecks className="size-3.5" />
                          Itinerary
                        </Link>
                      </Button>
                    </div>
                  </StickyNote>
                </StaggerItem>
              );
            })}
          </StaggerChildren>
        )}

        <StickyNote
          tiltId="board-tip"
          backgroundColor="oklch(0.97 0.02 95)"
          inkColor="oklch(0.35 0.04 50)"
          className={cn(
            "pointer-events-none absolute bottom-4 right-2 z-20 hidden max-w-[220px] lg:block",
          )}
        >
          <p className="font-display text-base font-bold">Quick tip</p>
          <p className="mt-1 text-xs leading-snug">
            Pin sessions from hub overlaps or schedule here. Open itinerary for
            voice channels and run-of-show.
          </p>
        </StickyNote>
      </div>
    </div>
  );
}
