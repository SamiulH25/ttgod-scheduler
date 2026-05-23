"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { getWeekEnd, getWeekStart } from "@/lib/calendar";
import { toast } from "sonner";
import type { ProposalSegment } from "@/components/calendar/event-day-column";
import { EventTimePicker } from "@/components/event-time-picker";
import { SlotFreeUsers } from "@/components/slot-free-users";
import { CopyPingButton } from "@/components/copy-ping-button";
import { StampMotion } from "@/components/motion/stamp-pop";
import { Pressable } from "@/components/motion/pressable";
import { Button } from "@/components/ui/button";
import { pickWinningProposal, pickWinningProposalRanked } from "@/lib/campaign-voting";
import { formatProposalRange } from "@/lib/dates";
import type { CalendarBlock } from "@/lib/calendar";
import { stickyColorForId } from "@/lib/sticky-colors";
import { cn } from "@/lib/utils";
import {
  findConflictingEvents,
  type EventTimeRange,
} from "@/lib/event-conflicts";
import {
  SchedulingConflictDialog,
  type ConflictUser,
} from "@/components/scheduling-conflict-dialog";
import { ChevronDown, ChevronUp, Sparkles } from "lucide-react";
import { motion } from "motion/react";
import { subWeeks } from "date-fns";

export type SchedulingEvent = {
  id: string;
  phase: string;
  start?: string | null;
  end?: string | null;
  proposals: {
    id: string;
    start: string;
    end: string;
    votes: { userId: string; rank?: number }[];
  }[];
  proposalVotes: { userId: string; proposalId: string; rank: number }[];
};

type CampaignSchedulingPanelProps = {
  event: SchedulingEvent;
  currentUserId: string;
  isHost: boolean;
  calendarEvents: EventTimeRange[];
  onUpdated: (patch?: Partial<SchedulingEvent>) => void | Promise<void>;
};

export function CampaignSchedulingPanel({
  event,
  currentUserId,
  isHost,
  calendarEvents,
  onUpdated,
}: CampaignSchedulingPanelProps) {
  const [draftStart, setDraftStart] = useState("");
  const [draftEnd, setDraftEnd] = useState("");
  const [busy, setBusy] = useState(false);
  const [stampKey, setStampKey] = useState(0);
  const [pollOpenedKey, setPollOpenedKey] = useState(0);
  const [voteFlashId, setVoteFlashId] = useState<string | null>(null);
  const [ghostBlocks, setGhostBlocks] = useState<CalendarBlock[]>([]);
  const [weekStart, setWeekStart] = useState(() => getWeekStart(new Date()));
  const [rankOrder, setRankOrder] = useState<string[]>([]);
  const [finalizeSealKey, setFinalizeSealKey] = useState(0);
  const [conflictOpen, setConflictOpen] = useState(false);
  const [conflicts, setConflicts] = useState<ConflictUser[]>([]);
  const [pendingWinner, setPendingWinner] = useState<string | null>(null);
  const [weekCompare, setWeekCompare] = useState<{
    perUser: {
      userId: string;
      freeMinutesA: number;
      freeMinutesB: number;
      deltaMinutes: number;
    }[];
  } | null>(null);
  const [compareBusy, setCompareBusy] = useState(false);

  const myTopVote = event.proposalVotes.find(
    (v) => v.userId === currentUserId && v.rank === 1,
  );

  const proposalSegments: ProposalSegment[] = useMemo(
    () =>
      event.proposals.map((p) => {
        const firstChoices = p.votes.filter((v) => (v.rank ?? 1) === 1).length;
        return {
          id: p.id,
          start: p.start,
          end: p.end,
          title: `${firstChoices} vote${firstChoices === 1 ? "" : "s"}`,
          color: stickyColorForId(p.id).bg,
          voteCount: firstChoices,
        };
      }),
    [event.proposals],
  );

  const conflictingEventIds = useMemo(() => {
    if (!draftStart || !draftEnd) return new Set<string>();
    const conflicts = findConflictingEvents(
      calendarEvents,
      new Date(draftStart),
      new Date(draftEnd),
      currentUserId,
      event.id,
    );
    return new Set(conflicts.map((c) => c.id));
  }, [calendarEvents, draftStart, draftEnd, currentUserId, event.id]);

  const loadGhostAvailability = useCallback(async () => {
    const from = weekStart;
    const to = getWeekEnd(weekStart);
    const res = await fetch(
      `/api/availability?from=${from.toISOString()}&to=${to.toISOString()}`,
    );
    if (res.ok) {
      const data = await res.json();
      setGhostBlocks(data.blocks ?? []);
    }
  }, [weekStart]);

  useEffect(() => {
    if (event.phase === "scheduling" && isHost) {
      void loadGhostAvailability();
    }
  }, [event.phase, isHost, loadGhostAvailability]);

  useEffect(() => {
    setRankOrder(event.proposals.map((p) => p.id));
  }, [event.proposals]);

  async function addProposal(start: string, end: string) {
    setBusy(true);
    const res = await fetch(`/api/events/${event.id}/proposals`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        start: new Date(start).toISOString(),
        end: new Date(end).toISOString(),
      }),
    });
    setBusy(false);
    if (!res.ok) {
      toast.error("Failed to add time slot");
      return;
    }
    toast.success("Time slot added");
    setDraftStart("");
    setDraftEnd("");
    onUpdated();
  }

  async function removeProposal(proposalId: string) {
    const res = await fetch(`/api/events/${event.id}/proposals/${proposalId}`, {
      method: "DELETE",
    });
    if (!res.ok) {
      toast.error("Failed to remove slot");
      return;
    }
    onUpdated();
  }

  async function castVote(proposalId: string) {
    const res = await fetch(`/api/events/${event.id}/vote`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ proposalId }),
    });
    if (!res.ok) {
      toast.error("Failed to save vote");
      return;
    }
    toast.success("Vote saved");
    setStampKey((k) => k + 1);
    setVoteFlashId(proposalId);
    window.setTimeout(() => setVoteFlashId(null), 1200);
    onUpdated();
  }

  async function suggestFromSquad() {
    setBusy(true);
    const from = weekStart;
    const to = getWeekEnd(weekStart);
    const res = await fetch(
      `/api/events/${event.id}/suggest-proposals?durationMinutes=120&from=${from.toISOString()}&to=${to.toISOString()}`,
    );
    setBusy(false);
    if (!res.ok) {
      toast.error("Could not load suggestions");
      return;
    }
    const data = await res.json();
    const slots = data.slots as { start: string; end: string }[];
    if (!slots.length) {
      toast.message("No common slots found for the squad this week");
      return;
    }
    const first = slots[0]!;
    await addProposal(first.start, first.end);
    toast.success("Added best squad overlap to the poll");
  }

  function moveProposal(id: string, dir: -1 | 1) {
    setRankOrder((prev) => {
      const i = prev.indexOf(id);
      if (i < 0) return prev;
      const j = i + dir;
      if (j < 0 || j >= prev.length) return prev;
      const next = [...prev];
      [next[i], next[j]] = [next[j]!, next[i]!];
      return next;
    });
  }

  async function saveRankedVote() {
    if (rankOrder.length === 0) return;
    setBusy(true);
    const res = await fetch(`/api/events/${event.id}/vote`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ proposalIds: rankOrder }),
    });
    setBusy(false);
    if (!res.ok) {
      toast.error("Failed to save ranked vote");
      return;
    }
    toast.success("Ranked vote saved");
    setStampKey((k) => k + 1);
    onUpdated();
  }

  async function runWeekCompare() {
    setCompareBusy(true);
    const weekBStart = subWeeks(weekStart, 1);
    const res = await fetch(
      `/api/availability/week-compare?weekAStart=${encodeURIComponent(weekBStart.toISOString())}&weekBStart=${encodeURIComponent(weekStart.toISOString())}`,
    );
    setCompareBusy(false);
    if (!res.ok) {
      toast.error("Could not compare weeks");
      return;
    }
    const data = await res.json();
    setWeekCompare(data.compare ?? null);
  }

  async function openScheduling() {
    setBusy(true);
    const res = await fetch(`/api/events/${event.id}/phase`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "open_scheduling" }),
    });
    setBusy(false);
    if (!res.ok) {
      toast.error("Could not open scheduling");
      return;
    }
    const data = await res.json();
    toast.success("Scheduling is open — add time slots");
    setPollOpenedKey((k) => k + 1);
    await onUpdated(patchFromPhaseResponse(data.event));
  }

  function resolveWinnerId(proposalId?: string): string | undefined {
    return (
      proposalId ??
      pickWinningProposalRanked(
        event.proposals.map((p) => ({
          id: p.id,
          start: p.start,
          end: p.end,
          votes: event.proposalVotes
            .filter((v) => v.proposalId === p.id)
            .map((v) => ({
              userId: v.userId,
              proposalId: v.proposalId,
              rank: v.rank,
            })),
        })),
        event.proposalVotes.map((v) => ({
          userId: v.userId,
          proposalId: v.proposalId,
          rank: v.rank,
        })),
      )?.id ??
      pickWinningProposal(
        event.proposals.map((p) => ({
          id: p.id,
          start: p.start,
          end: p.end,
          voteCount: p.votes.filter((v) => (v.rank ?? 1) === 1).length,
        })),
      )?.id
    );
  }

  async function doFinalize(winner: string) {
    setBusy(true);
    const res = await fetch(`/api/events/${event.id}/phase`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "finalize", proposalId: winner }),
    });
    setBusy(false);
    if (!res.ok) {
      toast.error("Failed to finalize");
      return;
    }
    const data = await res.json();
    toast.success("Campaign pinned to the calendar");
    setStampKey((k) => k + 1);
    setFinalizeSealKey((k) => k + 1);
    await onUpdated(patchFromPhaseResponse(data.event));
  }

  async function finalizePoll(proposalId?: string) {
    const winner = resolveWinnerId(proposalId);
    if (!winner) {
      toast.error("Add at least one time slot first");
      return;
    }
    const proposal = event.proposals.find((p) => p.id === winner);
    if (!proposal) return;

    const conflictRes = await fetch(
      `/api/events/${event.id}/scheduling-conflicts?start=${encodeURIComponent(proposal.start)}&end=${encodeURIComponent(proposal.end)}`,
    );
    if (conflictRes.ok) {
      const data = await conflictRes.json();
      const list = (data.conflicts ?? []) as ConflictUser[];
      if (list.length > 0) {
        setConflicts(list);
        setPendingWinner(winner);
        setConflictOpen(true);
        return;
      }
    }
    await doFinalize(winner);
  }

  if (event.phase === "scheduled" && event.start && event.end) {
    return (
      <p className="font-display text-lg font-bold">
        Pinned: {formatProposalRange(event.start, event.end)}
      </p>
    );
  }

  if (event.phase === "interest" && isHost) {
    return (
      <Pressable successKey={pollOpenedKey}>
        <Button type="button" onClick={openScheduling} disabled={busy}>
          Open scheduling poll
        </Button>
      </Pressable>
    );
  }

  if (event.phase !== "scheduling") {
    return null;
  }

  return (
    <div className="space-y-4">
      {isHost && (
        <>
          <p className="paper-flat px-3 py-2 font-sans text-sm text-muted-foreground">
            <span className="font-display font-bold text-[var(--paper-ink)]">
              Scheduling confidence:
            </span>{" "}
            compare weeks, check conflicts before finalize, copy a ping for Discord.
          </p>
          <p className="text-sm text-muted-foreground">
            Drag on the calendar to preview a slot, then add it to the poll.
            Faint blocks show squad availability.
          </p>
          <EventTimePicker
            start={draftStart}
            end={draftEnd}
            eventId={event.id}
            previewOnly
            weekStart={weekStart}
            onWeekStartChange={setWeekStart}
            onRangeChange={(s, e) => {
              setDraftStart(s);
              setDraftEnd(e);
            }}
            events={calendarEvents}
            proposals={proposalSegments}
            ghostBlocks={ghostBlocks}
            conflictingEventIds={conflictingEventIds}
            compactMobile
          />
          {draftStart && draftEnd && (
            <div className="flex flex-wrap items-center gap-2">
              <Button
                type="button"
                onClick={() => addProposal(draftStart, draftEnd)}
                disabled={busy || conflictingEventIds.size > 0}
              >
                Add this slot to poll
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => {
                  setDraftStart("");
                  setDraftEnd("");
                }}
              >
                Clear preview
              </Button>
              {conflictingEventIds.size > 0 && (
                <p className="text-xs text-destructive">
                  Conflicts with an event you&apos;re already in
                </p>
              )}
              {draftStart && draftEnd && (
                <CopyPingButton
                  title="Poll preview"
                  start={draftStart}
                  end={draftEnd}
                  people={[]}
                />
              )}
            </div>
          )}
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              disabled={busy}
              onClick={() => void suggestFromSquad()}
            >
              <Sparkles className="size-3.5" />
              Suggest from squad
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={compareBusy}
              onClick={() => void runWeekCompare()}
            >
              Week A vs B (guild)
            </Button>
          </div>
          {weekCompare && weekCompare.perUser.length > 0 && (
            <div className="paper-flat max-h-48 overflow-y-auto p-3 font-sans text-xs">
              <p className="mb-2 font-display font-bold">Free minutes · last week vs this</p>
              <ul className="space-y-1">
                {weekCompare.perUser.slice(0, 12).map((row) => (
                  <li key={row.userId} className="flex justify-between gap-2">
                    <span className="truncate font-mono text-[10px]">{row.userId.slice(0, 8)}…</span>
                    <span className="tabular-nums">
                      {row.freeMinutesA} → {row.freeMinutesB} ({row.deltaMinutes >= 0 ? "+" : ""}
                      {row.deltaMinutes})
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </>
      )}

      {!isHost && event.proposals.length > 0 && (
        <div className="lg:hidden">
          <p className="mb-2 text-sm font-semibold">Time slots</p>
          <ul className="space-y-2">
            {event.proposals.map((p) => (
              <li key={p.id} className="paper-sheet px-3 py-2">
                <p className="font-display font-bold">
                  {formatProposalRange(p.start, p.end)}
                </p>
                <SlotFreeUsers
                  start={p.start}
                  end={p.end}
                  eventId={event.id}
                  compact
                />
              </li>
            ))}
          </ul>
        </div>
      )}

      {event.proposals.length > 1 && (
        <div className="paper-sheet space-y-2 px-3 py-2">
          <p className="font-display text-sm font-bold">Ranked vote</p>
          <p className="text-xs text-muted-foreground">
            Order best → worst, then save. Uses the same poll vote endpoint.
          </p>
          <ol className="space-y-1">
            {rankOrder.map((id) => {
              const p = event.proposals.find((x) => x.id === id);
              if (!p) return null;
              return (
                <li
                  key={id}
                  className="flex flex-wrap items-center gap-1 rounded-sm border border-border/50 bg-muted/20 px-2 py-1 text-sm"
                >
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    className="h-7 w-7"
                    onClick={() => moveProposal(id, -1)}
                    aria-label="Move up"
                  >
                    <ChevronUp className="size-4" />
                  </Button>
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    className="h-7 w-7"
                    onClick={() => moveProposal(id, 1)}
                    aria-label="Move down"
                  >
                    <ChevronDown className="size-4" />
                  </Button>
                  <span className="font-display font-bold">
                    {formatProposalRange(p.start, p.end)}
                  </span>
                </li>
              );
            })}
          </ol>
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={busy}
            onClick={() => void saveRankedVote()}
          >
            Save ranking
          </Button>
        </div>
      )}

      <ul className="space-y-2">
        {event.proposals.length === 0 ? (
          <li className="text-sm text-muted-foreground">No time slots yet.</li>
        ) : (
          event.proposals.map((p) => {
            const selected = myTopVote?.proposalId === p.id;
            const firstChoices = p.votes.filter((v) => (v.rank ?? 1) === 1).length;
            const maxVotes = Math.max(
              0,
              ...event.proposals.map(
                (x) => x.votes.filter((v) => (v.rank ?? 1) === 1).length,
              ),
            );
            const isLeader = maxVotes > 0 && firstChoices === maxVotes;
            return (
              <li
                key={p.id}
                className={cn(
                  "paper-sheet flex flex-wrap items-center justify-between gap-2 px-3 py-2 transition-colors",
                  selected && "ring-2 ring-primary/40",
                  isLeader && voteFlashId && "bg-primary/8",
                  voteFlashId === p.id && "animate-proposal-flash",
                )}
              >
                <div className="min-w-0 flex-1 space-y-1">
                  <p className="font-display font-bold">
                    {formatProposalRange(p.start, p.end)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {firstChoices} vote{firstChoices === 1 ? "" : "s"}
                  </p>
                  <SlotFreeUsers
                    start={p.start}
                    end={p.end}
                    eventId={event.id}
                    compact
                  />
                </div>
                <div className="flex gap-2">
                  <StampMotion animationKey={stampKey}>
                    <Button
                      type="button"
                      size="sm"
                      variant={selected ? "default" : "outline"}
                      onClick={() => castVote(p.id)}
                    >
                      {selected ? "Voted" : "Vote"}
                    </Button>
                  </StampMotion>
                  {isHost && (
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      onClick={() => removeProposal(p.id)}
                    >
                      Remove
                    </Button>
                  )}
                </div>
              </li>
            );
          })
        )}
      </ul>

      {isHost && event.proposals.length > 0 && (
        <div className="relative inline-flex flex-col items-start gap-2">
          <StampMotion animationKey={stampKey}>
            <Button type="button" onClick={() => finalizePoll()} disabled={busy}>
              Finalize winning slot
            </Button>
          </StampMotion>
          {finalizeSealKey > 0 && (
            <motion.span
              key={finalizeSealKey}
              aria-hidden
              className="pointer-events-none absolute -right-1 -top-2 flex h-11 w-11 items-center justify-center rounded-full border-2 border-[oklch(0.42_0.12_25)] bg-[oklch(0.38_0.14_22)] text-[10px] font-bold uppercase leading-tight text-[oklch(0.92_0.02_95)] shadow-md wax-seal-burst"
              initial={{ scale: 0.6, rotate: -18, opacity: 0 }}
              animate={{ scale: 1, rotate: 8, opacity: 1 }}
              transition={{ type: "spring", stiffness: 420, damping: 18 }}
            >
              seal
            </motion.span>
          )}
        </div>
      )}

      <SchedulingConflictDialog
        open={conflictOpen}
        onOpenChange={setConflictOpen}
        conflicts={conflicts}
        onCancel={() => {
          setConflictOpen(false);
          setPendingWinner(null);
        }}
        onConfirm={() => {
          setConflictOpen(false);
          if (pendingWinner) void doFinalize(pendingWinner);
          setPendingWinner(null);
        }}
      />
    </div>
  );
}

function patchFromPhaseResponse(raw: {
  phase?: string;
  start?: string | null;
  end?: string | null;
  proposals?: SchedulingEvent["proposals"];
  proposalVotes?: { userId: string; proposalId: string; rank: number }[];
}): Partial<SchedulingEvent> {
  return {
    phase: raw.phase,
    start: raw.start ?? null,
    end: raw.end ?? null,
    proposals: raw.proposals,
    proposalVotes: raw.proposalVotes,
  };
}
