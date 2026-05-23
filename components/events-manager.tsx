"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import {
  AlertTriangle,
  Archive,
  ArchiveRestore,
  ChevronDown,
  Copy,
  ClipboardList,
  ListChecks,
  Users,
} from "lucide-react";
import { EventTimePicker } from "@/components/event-time-picker";
import { EmptyState } from "@/components/empty-state";
import { StickyNote } from "@/components/paper/sticky-note";
import { AnimatedStickyNote } from "@/components/motion/animated-sticky-note";
import { StampMotion } from "@/components/motion/stamp-pop";
import { StaggerChildren, StaggerItem } from "@/components/motion/stagger-children";
import { AnimatePresence, motion } from "motion/react";
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
import { countTowardCap } from "@/lib/campaign-capacity";
import { formatCostLineFromExpenses } from "@/lib/campaign-cost";
import {
  formatEventWhen,
  formatShort,
  toLocalDatetimeInputValue,
} from "@/lib/dates";
import { canManuallyArchiveEvent } from "@/lib/event-archive";
import {
  findConflictingEvents,
  findEventConflictPairs,
  formatConflictMessage,
} from "@/lib/event-conflicts";
import { attachmentForId, stickyColorForId } from "@/lib/sticky-colors";
import { ImageZoomButton } from "@/components/image-lightbox";
import { cn } from "@/lib/utils";
import { SeasonBoardCollapsible } from "@/components/season-board-collapsible";

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
  phase: string;
  start: string | null;
  end: string | null;
  maxParticipants: number | null;
  costCurrency: string;
  costSplitEvenly: boolean;
  expenses?: { id: string; label: string; amountCents: number }[];
  createdById: string;
  createdBy: SquadUser;
  participants: {
    userId: string | null;
    status: string;
    guestEmail: string | null;
    displayName: string | null;
    user: SquadUser | null;
  }[];
  proposals?: { id: string }[];
  images?: { id: string; url: string }[];
};

const PHASE_LABELS: Record<string, string> = {
  interest: "Interest",
  scheduling: "Scheduling",
  scheduled: "Scheduled",
};

function upsertMyParticipation(
  participants: EventRow["participants"],
  userId: string,
  status: string,
): EventRow["participants"] {
  const existing = participants.find((p) => p.userId === userId);
  if (existing) {
    return participants.map((p) =>
      p.userId === userId ? { ...p, status } : p,
    );
  }
  return [
    ...participants,
    {
      userId,
      status,
      guestEmail: null,
      displayName: null,
      user: { id: userId, name: null, image: null },
    },
  ];
}

function serializeListEvent(raw: EventRow): EventRow {
  return raw;
}

type EventsManagerProps = {
  currentUserId: string;
  presetStart?: string;
  presetEnd?: string;
  showQuickTip?: boolean;
  initialEvents?: EventRow[];
  initialArchivedEvents?: EventRow[];
  initialUsers?: SquadUser[];
};

export function EventsManager({
  currentUserId,
  presetStart,
  presetEnd,
  showQuickTip: showQuickTipInitial = true,
  initialEvents,
  initialArchivedEvents,
  initialUsers,
}: EventsManagerProps) {
  const hasInitial = initialEvents !== undefined;
  const [events, setEvents] = useState<EventRow[]>(initialEvents ?? []);
  const [archivedEvents, setArchivedEvents] = useState<EventRow[]>(
    initialArchivedEvents ?? [],
  );
  const [showQuickTip, setShowQuickTip] = useState(showQuickTipInitial);
  const [archiveOpen, setArchiveOpen] = useState(false);
  const [users, setUsers] = useState<SquadUser[]>(initialUsers ?? []);
  const [loading, setLoading] = useState(!hasInitial);
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
  const [stampKeys, setStampKeys] = useState<Record<string, number>>({});
  const [scheduleImmediately, setScheduleImmediately] = useState(false);
  const [maxParticipants, setMaxParticipants] = useState("");
  const [templates, setTemplates] = useState<{ id: string; title: string }[]>([]);
  const [templateId, setTemplateId] = useState<string>("");
  const [saveAsTemplate, setSaveAsTemplate] = useState(false);

  const calendarEvents = useMemo(
    () =>
      events
        .filter((e) => e.phase === "scheduled" && e.start && e.end)
        .map((e) => ({
          id: e.id,
          title: e.title,
          phase: e.phase,
          start: e.start!,
          end: e.end!,
          createdById: e.createdById,
          participants: e.participants
            .filter((p) => p.userId != null)
            .map((p) => ({
              userId: p.userId as string,
              status: p.status,
            })),
        })),
    [events],
  );

  const load = useCallback(async (opts?: { silent?: boolean }) => {
    if (!opts?.silent) setLoading(true);
    const [eventsRes, archivedRes, usersRes] = await Promise.all([
      fetch("/api/events"),
      fetch("/api/events?archived=true"),
      fetch("/api/users"),
    ]);
    if (eventsRes.ok) {
      const data = await eventsRes.json();
      setEvents(data.events ?? []);
    }
    if (archivedRes.ok) {
      const data = await archivedRes.json();
      setArchivedEvents(data.events ?? []);
    }
    if (usersRes.ok) {
      const data = await usersRes.json();
      setUsers(data.users ?? []);
    }
    if (!opts?.silent) setLoading(false);
  }, []);

  useEffect(() => {
    if (!hasInitial) load();
  }, [hasInitial, load]);

  useEffect(() => {
    if (presetApplied || !presetStart || !presetEnd) return;
    setStart(toLocalDatetimeInputValue(new Date(presetStart)));
    setEnd(toLocalDatetimeInputValue(new Date(presetEnd)));
    setTitle("Squad session");
    setScheduleImmediately(true);
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
    void fetch("/api/templates")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => setTemplates(d?.templates ?? []))
      .catch(() => setTemplates([]));
  }, [createOpen]);

  useEffect(() => {
    if (!createOpen) return;
    const timer = setTimeout(() => fetchFreeUsers(start, end), 300);
    return () => clearTimeout(timer);
  }, [start, end, createOpen, fetchFreeUsers]);

  const scheduleConflicts = useMemo(() => {
    if (!scheduleImmediately || !start || !end) return [];
    const rangeStart = new Date(start);
    const rangeEnd = new Date(end);
    if (rangeEnd <= rangeStart) return [];
    return findConflictingEvents(events, rangeStart, rangeEnd, currentUserId);
  }, [events, start, end, currentUserId, scheduleImmediately]);

  const bulletinConflictPairs = useMemo(
    () => findEventConflictPairs(events, currentUserId),
    [events, currentUserId],
  );

  const conflictingEventIds = useMemo(() => {
    const ids = new Set<string>();
    for (const pair of bulletinConflictPairs) {
      ids.add(pair.a.id);
      ids.add(pair.b.id);
    }
    for (const c of scheduleConflicts) {
      ids.add(c.id);
    }
    return ids;
  }, [bulletinConflictPairs, scheduleConflicts]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (scheduleImmediately) {
      if (!start || !end) {
        toast.error("Pick a time on the calendar");
        return;
      }
      if (scheduleConflicts.length > 0) {
        toast.error(formatConflictMessage(scheduleConflicts));
        return;
      }
    }

    const res = await fetch("/api/events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title,
        description: description || undefined,
        phase: scheduleImmediately ? "scheduled" : "interest",
        start: scheduleImmediately ? new Date(start).toISOString() : undefined,
        end: scheduleImmediately ? new Date(end).toISOString() : undefined,
        maxParticipants: maxParticipants ? parseInt(maxParticipants, 10) : null,
        participantUserIds,
        templateId: templateId || undefined,
      }),
    });
    if (!res.ok) {
      const err = await res.json();
      toast.error(err.error ?? "Failed to create campaign");
      return;
    }
    const data = await res.json();
    const freeCount = data.notifyTargets?.length ?? 0;
    toast.success(
      scheduleImmediately
        ? freeCount > 0
          ? `Session pinned — ${freeCount} squad free`
          : "Session pinned"
        : "Campaign started — gathering interest",
    );
    const created = data.event as EventRow;
    if (saveAsTemplate) {
      const dur =
        scheduleImmediately && start && end
          ? Math.max(
              15,
              Math.round(
                (new Date(end).getTime() - new Date(start).getTime()) / 60000,
              ),
            )
          : 120;
      await fetch("/api/templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: `${title} (template)`,
          description: description || undefined,
          durationMinutes: dur,
          defaultPhase: scheduleImmediately ? "scheduled" : "interest",
        }),
      }).catch(() => {});
    }
    setLastCreatedId(created.id);
    setShowQuickTip(false);
    setCreateOpen(false);
    setTitle("");
    setDescription("");
    setStart("");
    setEnd("");
    setMaxParticipants("");
    setScheduleImmediately(false);
    setParticipantUserIds([]);
    setFreeUsers([]);
    setTemplateId("");
    setSaveAsTemplate(false);
    setEvents((prev) => [serializeListEvent(created), ...prev]);
    fetch("/api/user/onboarding", { method: "PATCH" }).catch(() => {});
  }

  function bumpStamp(eventId: string) {
    setStampKeys((prev) => ({
      ...prev,
      [eventId]: (prev[eventId] ?? 0) + 1,
    }));
  }

  async function duplicateCampaign(eventId: string) {
    const res = await fetch(`/api/events/${eventId}/duplicate`, {
      method: "POST",
    });
    if (!res.ok) {
      toast.error("Could not duplicate campaign");
      return;
    }
    const data = await res.json();
    toast.success("Duplicated — opening board entry");
    await load({ silent: true });
    if (data.event?.id) {
      setLastCreatedId(data.event.id);
    }
  }

  async function moveCampaignPhase(
    eventId: string,
    action: "open_scheduling" | "reopen_interest",
  ) {
    const res = await fetch(`/api/events/${eventId}/phase`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      toast.error((err as { error?: string }).error ?? "Could not move phase");
      return;
    }
    toast.success(
      action === "open_scheduling"
        ? "Scheduling poll opened"
        : "Moved back to interest",
    );
    await load({ silent: true });
  }

  async function respondInterest(
    eventId: string,
    status: "interested" | "not_interested",
  ) {
    bumpStamp(eventId);
    const res = await fetch(`/api/events/${eventId}/participation`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      const detail =
        err?.details?.fieldErrors?.status?.[0] ??
        err?.details?.formErrors?.[0];
      toast.error(detail ?? err?.error ?? "Failed to update interest");
      return;
    }
    toast.success(status === "interested" ? "Marked interested" : "Not interested");
    setEvents((prev) =>
      prev.map((e) =>
        e.id === eventId
          ? {
              ...e,
              participants: upsertMyParticipation(
                e.participants,
                currentUserId,
                status,
              ),
            }
          : e,
      ),
    );
  }

  async function respond(eventId: string, status: "accepted" | "declined") {
    bumpStamp(eventId);
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
    setEvents((prev) =>
      prev.map((e) =>
        e.id === eventId
          ? {
              ...e,
              participants: upsertMyParticipation(
                e.participants,
                currentUserId,
                status,
              ),
            }
          : e,
      ),
    );
  }

  async function setEventArchived(eventId: string, archived: boolean) {
    const res = await fetch(`/api/events/${eventId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ archived }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      toast.error(
        (err as { error?: string }).error ??
          (archived ? "Failed to archive" : "Failed to restore"),
      );
      return;
    }
    toast.success(archived ? "Moved to archive" : "Restored to bulletin");
    const data = await res.json();
    const updated = data.event as EventRow;
    if (archived) {
      setEvents((prev) => prev.filter((e) => e.id !== eventId));
      setArchivedEvents((prev) => [serializeListEvent(updated), ...prev]);
    } else {
      setArchivedEvents((prev) => prev.filter((e) => e.id !== eventId));
      setEvents((prev) => [serializeListEvent(updated), ...prev]);
    }
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
            <Button variant="default">Start campaign</Button>
          </DialogTrigger>
          <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-3xl">
            <DialogHeader>
              <DialogTitle className="font-display">New campaign</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreate} className="space-y-6">
              <section className="space-y-3">
                <div className="space-y-2">
                  <Label htmlFor="title">Campaign title</Label>
                  <Input
                    id="title"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                  />
                </div>
                {templates.length > 0 && (
                  <div className="space-y-2">
                    <Label htmlFor="tpl">Start from template (optional)</Label>
                    <select
                      id="tpl"
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                      value={templateId}
                      onChange={(e) => {
                        const id = e.target.value;
                        setTemplateId(id);
                        const t = templates.find((x) => x.id === id);
                        if (t) setTitle(t.title);
                      }}
                    >
                      <option value="">— None —</option>
                      {templates.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.title}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
                <div className="space-y-2">
                  <Label htmlFor="description">Summary (optional)</Label>
                  <Input
                    id="description"
                    placeholder="One-line note for the sticky"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="max-p">Max people (optional)</Label>
                  <Input
                    id="max-p"
                    type="number"
                    min={1}
                    placeholder="Unlimited"
                    value={maxParticipants}
                    onChange={(e) => setMaxParticipants(e.target.value)}
                  />
                </div>
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={scheduleImmediately}
                    onChange={(e) => setScheduleImmediately(e.target.checked)}
                  />
                  Pin with a fixed time now (skip interest &amp; poll)
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={saveAsTemplate}
                    onChange={(e) => setSaveAsTemplate(e.target.checked)}
                  />
                  Save as reusable template after create
                </label>
              </section>

              {scheduleImmediately && (
              <section className="space-y-3">
                <h3 className="prose-label text-primary">When</h3>
                <EventTimePicker
                  start={start}
                  end={end}
                  onRangeChange={(nextStart, nextEnd) => {
                    setStart(nextStart);
                    setEnd(nextEnd);
                  }}
                  events={calendarEvents}
                  conflictingEventIds={conflictingEventIds}
                  compactMobile
                />
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="ev-start">Start</Label>
                    <Input
                      id="ev-start"
                      type="datetime-local"
                      required={scheduleImmediately}
                      value={start}
                      onChange={(e) => setStart(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="ev-end">End</Label>
                    <Input
                      id="ev-end"
                      type="datetime-local"
                      required={scheduleImmediately}
                      value={end}
                      onChange={(e) => setEnd(e.target.value)}
                    />
                  </div>
                </div>
                {scheduleConflicts.length > 0 && (
                  <div
                    role="alert"
                    className="flex gap-2 rounded-lg border-2 border-destructive/50 bg-destructive/10 px-3 py-2.5"
                  >
                    <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
                    <div className="min-w-0 text-sm">
                      <p className="font-display font-bold text-destructive">
                        Conflicting times
                      </p>
                      <p className="mt-0.5 text-[var(--paper-ink)]">
                        {formatConflictMessage(scheduleConflicts)} Drag a different
                        slot on the calendar or adjust the times below.
                      </p>
                      <ul className="mt-2 space-y-1 text-xs text-muted-foreground">
                        {scheduleConflicts.map((c) => (
                          <li key={c.id}>
                            {c.title}
                            {c.start && c.end
                              ? `: ${formatShort(new Date(c.start))} – ${formatShort(new Date(c.end))}`
                              : ""}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}
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
              )}

              <section className="space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="prose-label text-primary">Who</h3>
                  {scheduleImmediately && freeUsers.length > 0 && (
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

              <Button
                type="submit"
                variant="default"
                className="w-full"
                disabled={scheduleImmediately && scheduleConflicts.length > 0}
              >
                {scheduleImmediately ? "Pin to board" : "Start campaign"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="bg-bulletin-board relative overflow-hidden p-5 sm:p-8 md:p-10">
        <p className="relative z-10 mb-6 font-display text-2xl font-bold text-white drop-shadow-sm sm:text-3xl">
          Squad bulletin
        </p>

        {!loading && bulletinConflictPairs.length > 0 && (
          <div
            role="alert"
            className="relative z-10 mb-4 flex gap-2 rounded-lg border-2 border-amber-400/80 bg-amber-50/95 px-3 py-2.5 text-amber-950 shadow-sm"
          >
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
            <div className="min-w-0 text-sm">
              <p className="font-display font-bold">Conflicting events on your board</p>
              <ul className="mt-1 space-y-0.5">
                {bulletinConflictPairs.map(({ a, b }) => (
                  <li key={`${a.id}-${b.id}`}>
                    “{a.title}” overlaps “{b.title}”
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}

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
                iconName="calendar"
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
          <div className="relative z-10 space-y-8">
            {(["interest", "scheduling", "scheduled"] as const).map((phaseKey) => {
              const phaseEvents = events.filter((ev) => ev.phase === phaseKey);
              if (phaseEvents.length === 0) return null;
              return (
                <div key={phaseKey}>
                  <p className="bulletin-chalk-label mb-4">
                    {PHASE_LABELS[phaseKey] ?? phaseKey}
                  </p>
                  <StaggerChildren className="bulletin-sticky-grid grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
            {phaseEvents.map((ev) => {
              const colors = stickyColorForId(ev.id);
              const attach = attachmentForId(ev.id);
              const mine = ev.participants.find(
                (p) => p.userId === currentUserId,
              );
              const isHost = ev.createdById === currentUserId;
              const invitePending =
                ev.phase === "scheduled" &&
                mine?.status === "pending" &&
                !isHost;
              const canRespondInterest =
                ev.phase === "interest" || ev.phase === "scheduling";
              const myInterested = mine?.status === "interested";
              const myNotInterested = mine?.status === "not_interested";
              const capCount = countTowardCap(ev.phase, ev.participants);
              const costLine = formatCostLineFromExpenses(
                ev.expenses,
                ev.costCurrency,
                ev.costSplitEvenly,
                capCount,
              );
              const whenLabel = formatEventWhen(
                ev.phase,
                ev.start,
                ev.end,
                ev.proposals?.length ?? 0,
              );
              const hasConflict = conflictingEventIds.has(ev.id);
              const canArchive = canManuallyArchiveEvent({
                phase: ev.phase,
                end: ev.end,
              });

              return (
                <StaggerItem key={ev.id}>
                  <AnimatedStickyNote
                    tiltId={ev.id}
                    backgroundColor={colors.bg}
                    inkColor={colors.ink}
                    attachment={attach.kind}
                    tapeCorner={attach.tapeCorner}
                    bulletin
                    interactive
                    highlight={lastCreatedId === ev.id}
                    className={cn(
                      "flex min-h-[200px] flex-col",
                      hasConflict && "ring-2 ring-destructive/70 ring-offset-2",
                    )}
                  >
                    {hasConflict && (
                      <div className="mb-2 flex items-center gap-1.5 rounded-md bg-destructive/15 px-2 py-1 text-xs font-semibold text-destructive">
                        <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                        Conflicts with another event
                      </div>
                    )}
                    <div className="flex items-start gap-2">
                      <UserAvatar
                        name={ev.createdBy.name}
                        image={ev.createdBy.image}
                        size="sm"
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <StatusBadge
                            variant="muted"
                            className="badge-on-sticky"
                          >
                            {PHASE_LABELS[ev.phase] ?? ev.phase}
                          </StatusBadge>
                        </div>
                        <h3 className="font-display text-xl font-bold leading-tight">
                          {ev.title}
                        </h3>
                        <p className="mt-1 text-sm font-semibold opacity-90">
                          {whenLabel}
                        </p>
                        {ev.maxParticipants != null && (
                          <p className="text-xs opacity-80">
                            {capCount} / {ev.maxParticipants}{" "}
                            {ev.phase === "scheduled" ? "going" : "interested"}
                          </p>
                        )}
                        {costLine && (
                          <p className="text-xs opacity-80">{costLine}</p>
                        )}
                      </div>
                    </div>

                    {ev.images && ev.images.length > 0 && (
                      <div className="mt-2 flex gap-1">
                        {ev.images.slice(0, 3).map((img, imgIndex) => (
                          <ImageZoomButton
                            key={img.id}
                            images={ev.images!.map((i) => ({
                              id: i.id,
                              url: i.url,
                            }))}
                            index={imgIndex}
                            stopPropagation
                            className="rounded"
                          >
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={img.url}
                              alt=""
                              className="h-10 w-10 rounded object-cover border border-black/10"
                            />
                          </ImageZoomButton>
                        ))}
                      </div>
                    )}

                    {ev.description ? (
                      <p className="mt-3 line-clamp-4 text-sm leading-snug">
                        {ev.description}
                      </p>
                    ) : null}

                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      <div className="flex -space-x-1">
                        {ev.participants.slice(0, 5).map((p) => (
                          <UserAvatar
                            key={p.user?.id ?? p.guestEmail ?? "guest"}
                            name={p.user?.name ?? p.displayName ?? p.guestEmail ?? "Guest"}
                            image={p.user?.image ?? null}
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

                    {canRespondInterest && (
                      <div className="mt-3 flex flex-wrap items-center gap-2">
                        <StampMotion animationKey={stampKeys[ev.id] ?? 0}>
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            disablePressable
                            className={cn(
                              "btn-sticky",
                              myInterested && "btn-sticky-active",
                            )}
                            onClick={(e) => {
                              e.stopPropagation();
                              respondInterest(ev.id, "interested");
                            }}
                          >
                            Yes
                          </Button>
                        </StampMotion>
                        <StampMotion animationKey={stampKeys[ev.id] ?? 0}>
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            disablePressable
                            className={cn(
                              "btn-sticky",
                              myNotInterested && "btn-sticky-active",
                            )}
                            onClick={(e) => {
                              e.stopPropagation();
                              respondInterest(ev.id, "not_interested");
                            }}
                          >
                            No
                          </Button>
                        </StampMotion>
                        {isHost && (
                          <span className="text-xs font-semibold text-[var(--sticky-ink)]">
                            Host
                          </span>
                        )}
                      </div>
                    )}

                    {isHost && ev.phase === "interest" && (
                      <div className="mt-2 flex flex-wrap gap-2">
                        <Button
                          type="button"
                          size="sm"
                          variant="secondary"
                          className="btn-sticky"
                          onClick={(e) => {
                            e.stopPropagation();
                            void moveCampaignPhase(ev.id, "open_scheduling");
                          }}
                        >
                          → Scheduling column
                        </Button>
                      </div>
                    )}
                    {isHost && ev.phase === "scheduling" && (
                      <div className="mt-2 flex flex-wrap gap-2">
                        <Button
                          type="button"
                          size="sm"
                          variant="secondary"
                          className="btn-sticky"
                          onClick={(e) => {
                            e.stopPropagation();
                            void moveCampaignPhase(ev.id, "reopen_interest");
                          }}
                        >
                          ← Interest column
                        </Button>
                      </div>
                    )}

                    {invitePending && (
                      <div className="mt-3 flex flex-wrap gap-2">
                        <StampMotion animationKey={stampKeys[ev.id] ?? 0}>
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            disablePressable
                            className="btn-sticky btn-sticky-active"
                            onClick={(e) => {
                              e.stopPropagation();
                              respond(ev.id, "accepted");
                            }}
                          >
                            Accept
                          </Button>
                        </StampMotion>
                        <StampMotion animationKey={stampKeys[ev.id] ?? 0}>
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            disablePressable
                            className="btn-sticky"
                            onClick={(e) => {
                              e.stopPropagation();
                              respond(ev.id, "declined");
                            }}
                          >
                            Decline
                          </Button>
                        </StampMotion>
                      </div>
                    )}

                    <div className="mt-auto flex flex-wrap justify-end gap-2 pt-4">
                      {isHost && canArchive && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="btn-sticky"
                          onClick={(e) => {
                            e.stopPropagation();
                            setEventArchived(ev.id, true);
                          }}
                        >
                          <Archive className="size-3.5" />
                          Archive
                        </Button>
                      )}
                      {isHost && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="btn-sticky"
                          onClick={(e) => {
                            e.stopPropagation();
                            void duplicateCampaign(ev.id);
                          }}
                        >
                          <Copy className="size-3.5" />
                          Duplicate
                        </Button>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        className="btn-sticky"
                        asChild
                      >
                        <Link href={`/events/${ev.id}`}>Open</Link>
                      </Button>
                      {ev.phase === "scheduled" && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="btn-sticky"
                          asChild
                        >
                          <Link href={`/events/${ev.id}/plans`}>
                            <ListChecks className="size-3.5" />
                            Itinerary
                          </Link>
                        </Button>
                      )}
                    </div>
                  </AnimatedStickyNote>
                </StaggerItem>
              );
            })}
                  </StaggerChildren>
                </div>
              );
            })}
          </div>
        )}

        {showQuickTip && (
          <AnimatedStickyNote
            tiltId="board-tip"
            backgroundColor="oklch(0.97 0.02 95)"
            inkColor="oklch(0.35 0.04 50)"
            enter={false}
            layout={false}
            className={cn(
              "pointer-events-none absolute bottom-4 right-2 z-20 hidden max-w-[220px] animate-float-note lg:block",
            )}
          >
            <p className="font-display text-base font-bold">Quick tip</p>
            <p className="mt-1 text-xs leading-snug">
              Pin sessions from hub overlaps or schedule here. Open itinerary for
              voice channels and run-of-show.
            </p>
          </AnimatedStickyNote>
        )}
      </div>

      {!loading && archivedEvents.length > 0 && (
        <div className="rounded-xl border border-border/60 bg-card/80 shadow-sm">
          <button
            type="button"
            onClick={() => setArchiveOpen((o) => !o)}
            className="flex w-full items-center justify-between gap-2 px-4 py-3 text-left font-display text-lg font-bold transition-colors hover:bg-muted/40"
          >
            <span className="flex items-center gap-2">
              <Archive className="size-5 opacity-70" />
              Archive
              <span className="text-sm font-semibold text-muted-foreground">
                ({archivedEvents.length})
              </span>
            </span>
            <ChevronDown
              className={cn(
                "size-5 shrink-0 opacity-60 transition-transform",
                archiveOpen && "rotate-180",
              )}
            />
          </button>
          <AnimatePresence initial={false}>
            {archiveOpen && (
              <motion.div
                key="archive-panel"
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
                className="overflow-hidden border-t border-border/60"
              >
            <div className="px-4 pb-4 pt-2">
              <p className="mb-4 text-sm text-muted-foreground">
                Completed or archived trips — hidden from the bulletin board.
              </p>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {archivedEvents.map((ev) => {
                  const colors = stickyColorForId(ev.id);
                  const isHost = ev.createdById === currentUserId;
                  const whenLabel = formatEventWhen(
                    ev.phase,
                    ev.start,
                    ev.end,
                    ev.proposals?.length ?? 0,
                  );
                  return (
                    <StickyNote
                      key={ev.id}
                      tiltId={`archive-${ev.id}`}
                      backgroundColor={colors.bg}
                      inkColor={colors.ink}
                      interactive
                      className="flex min-h-[160px] flex-col opacity-95"
                    >
                      <div className="flex flex-wrap items-center gap-1.5">
                        <StatusBadge variant="muted" className="badge-on-sticky">
                          {PHASE_LABELS[ev.phase] ?? ev.phase}
                        </StatusBadge>
                        <StatusBadge variant="muted" className="badge-on-sticky">
                          Archived
                        </StatusBadge>
                      </div>
                      <h3 className="mt-1 font-display text-lg font-bold leading-tight">
                        {ev.title}
                      </h3>
                      <p className="mt-1 text-sm font-semibold opacity-90">
                        {whenLabel}
                      </p>
                      <div className="mt-auto flex flex-wrap justify-end gap-2 pt-3">
                        {isHost && (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="btn-sticky"
                            onClick={() => setEventArchived(ev.id, false)}
                          >
                            <ArchiveRestore className="size-3.5" />
                            Restore
                          </Button>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          className="btn-sticky"
                          asChild
                        >
                          <Link href={`/events/${ev.id}`}>Open</Link>
                        </Button>
                      </div>
                    </StickyNote>
                  );
                })}
              </div>
            </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      <SeasonBoardCollapsible currentUserId={currentUserId} />
    </div>
  );
}
