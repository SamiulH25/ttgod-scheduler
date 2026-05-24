"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ImageLightbox, type LightboxImage } from "@/components/image-lightbox";
import Link from "next/link";
import Image from "next/image";
import { toast } from "sonner";
import {
  CampaignExpensesTable,
  type CampaignExpense,
} from "@/components/campaign-expenses-table";
import { CampaignSchedulingPanel, type SchedulingEvent } from "@/components/campaign-scheduling-panel";
import { HostPlaybook } from "@/components/campaign/host-playbook";
import { CampaignPhaseFlow } from "@/components/campaign/campaign-phase-flow";
import { summarizeCampaignInterest } from "@/lib/campaign-interest";
import { CampaignMoreOptions } from "@/components/campaign-more-options";
import { CampaignShareMenu } from "@/components/campaign-share-menu";
import { AttendanceStamps } from "@/components/attendance-stamps";
import { RecapPolaroidStrip } from "@/components/recap-polaroid-strip";
import {
  CampaignResourcesPanel,
  type CampaignResourceRow,
} from "@/components/campaign/campaign-resources-panel";
import { CampaignHero } from "@/components/campaign/campaign-hero";
import { CampaignInvitePanel } from "@/components/campaign/campaign-invite-panel";
import { CampaignInterestActions } from "@/components/campaign/campaign-interest-actions";
import { CampaignRsvpBanner } from "@/components/campaign/campaign-rsvp-banner";
import { CampaignSection } from "@/components/campaign/campaign-section";
import { StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { countTowardCap } from "@/lib/campaign-capacity";
import { PopIn } from "@/components/motion/pop-in";
import { formatCostLineFromExpenses } from "@/lib/campaign-cost";
import { canEditExpenses } from "@/lib/event-expenses";
import { formatEventWhen, formatShort } from "@/lib/dates";
import type { EventRecap } from "@/lib/event-recap";
import { ClipboardList, Copy } from "lucide-react";

export type CampaignDetailEvent = SchedulingEvent & {
  title: string;
  description: string | null;
  phase: string;
  start: string | null;
  end: string | null;
  maxParticipants: number | null;
  costCurrency: string;
  costSplitEvenly: boolean;
  expenses: CampaignExpense[];
  createdById: string;
  createdBy: { id: string; name: string | null; image: string | null };
  archivedAt?: string | null;
  participants: {
    id?: string;
    userId: string | null;
    status: string;
    waitlistPosition?: number | null;
    guestEmail?: string | null;
    displayName?: string | null;
    roleId?: string | null;
    isBackup?: boolean;
    user?: { id: string; name: string | null; image: string | null } | null;
  }[];
  images: {
    id: string;
    url: string;
    mimeType: string;
    storageKey: string;
  }[];
  resources: CampaignResourceRow[];
};

type CalendarEventRange = Parameters<
  typeof CampaignSchedulingPanel
>[0]["calendarEvents"];

type CampaignDetailProps = {
  event: CampaignDetailEvent;
  currentUserId: string;
  calendarEvents?: CalendarEventRange;
};

const PHASE_LABELS: Record<string, string> = {
  interest: "Gathering interest",
  scheduling: "Scheduling",
  scheduled: "Pinned event",
};

export function CampaignDetail({
  event: initial,
  currentUserId,
  calendarEvents: calendarEventsProp,
}: CampaignDetailProps) {
  const [event, setEvent] = useState(initial);
  const [calendarEvents, setCalendarEvents] = useState<CalendarEventRange>(
    calendarEventsProp ?? [],
  );

  useEffect(() => {
    setEvent(initial);
    // Only reset client state when opening a different campaign (avoid stale RSC props).
    // eslint-disable-next-line react-hooks/exhaustive-deps -- intentional: [initial.id] only
  }, [initial.id]);
  const [interestStamp, setInterestStamp] = useState(0);
  const [photoLightboxOpen, setPhotoLightboxOpen] = useState(false);
  const [photoLightboxIndex, setPhotoLightboxIndex] = useState(0);
  const [recap, setRecap] = useState<EventRecap | null>(null);

  useEffect(() => {
    if (calendarEventsProp?.length) {
      setCalendarEvents(calendarEventsProp);
      return;
    }
    let cancelled = false;
    fetch("/api/events?ranges=1")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!cancelled && data?.events) {
          setCalendarEvents(data.events);
        }
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [calendarEventsProp]);
  const fileRef = useRef<HTMLInputElement>(null);
  const isHost = event.createdById === currentUserId;
  const interestStats = summarizeCampaignInterest(event.participants);
  const capCount = countTowardCap(event.phase, event.participants);
  const costLine = formatCostLineFromExpenses(
    event.expenses,
    event.costCurrency,
    event.costSplitEvenly,
    capCount,
  );
  const showExpenses =
    canEditExpenses(event.phase) || event.expenses.length > 0;

  const photoLightboxImages: LightboxImage[] = event.images.map((img) => ({
    id: img.id,
    url: img.url,
  }));

  const reload = useCallback(async () => {
    const res = await fetch(`/api/events/${event.id}`, { cache: "no-store" });
    if (res.ok) {
      const data = await res.json();
      setEvent(data.event);
      return;
    }
    toast.error("Could not refresh event");
  }, [event.id]);

  const eventEnd = event.end ? new Date(event.end) : null;
  const isPastSession =
    Boolean(eventEnd) && eventEnd!.getTime() < Date.now();
  const isEndedForAttendance =
    Boolean(event.archivedAt) ||
    (event.phase === "scheduled" && isPastSession);
  const participantUserIds = event.participants
    .map((p) => p.userId)
    .filter((id): id is string => Boolean(id));

  useEffect(() => {
    if (!event.archivedAt) {
      setRecap(null);
      return;
    }
    let cancelled = false;
    fetch(`/api/events/${event.id}/recap`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (!cancelled && d?.recap) setRecap(d.recap as EventRecap);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [event.archivedAt, event.id]);

  useEffect(() => {
    void reload();
  }, [reload]);

  const handleSchedulingUpdated = useCallback(
    async (patch?: Partial<SchedulingEvent>) => {
      if (patch) {
        setEvent((prev) => ({
          ...prev,
          ...patch,
          proposals: patch.proposals ?? prev.proposals,
          proposalVotes: patch.proposalVotes ?? prev.proposalVotes,
        }));
      }
      await reload();
    },
    [reload],
  );

  async function respondInterest(status: "interested" | "not_interested") {
    setInterestStamp((k) => k + 1);
    const res = await fetch(`/api/events/${event.id}/participation`, {
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
    const data = await res.json();
    const nextStatus = data.participation?.status as string | undefined;
    if (nextStatus) {
      setEvent((prev) => ({
        ...prev,
        participants: prev.participants.some((p) => p.userId === currentUserId)
          ? prev.participants.map((p) =>
              p.userId === currentUserId ? { ...p, status: nextStatus } : p,
            )
          : [
              ...prev.participants,
              {
                userId: currentUserId,
                status: nextStatus,
                user: {
                  id: currentUserId,
                  name: null,
                  image: null,
                },
              },
            ],
      }));
    }
    toast.success(
      nextStatus === "interested" ? "Marked interested" : "Marked not interested",
    );
  }

  async function uploadImage(file: File) {
    const form = new FormData();
    form.set("file", file);
    const res = await fetch(`/api/events/${event.id}/images`, {
      method: "POST",
      body: form,
    });
    if (!res.ok) {
      toast.error("Upload failed");
      return;
    }
    toast.success("Photo attached");
    reload();
  }

  async function duplicateCampaign() {
    const res = await fetch(`/api/events/${event.id}/duplicate`, { method: "POST" });
    if (!res.ok) {
      toast.error("Duplicate failed");
      return;
    }
    const data = await res.json();
    toast.success("Campaign duplicated");
    if (data.event?.id) {
      window.location.href = `/events/${data.event.id}`;
    }
  }

  async function promoteFromWaitlist() {
    const res = await fetch(`/api/events/${event.id}/waitlist/promote`, {
      method: "POST",
    });
    if (!res.ok) {
      toast.error("Could not promote");
      return;
    }
    toast.success("Promoted next on waitlist");
    reload();
  }

  const mine = event.participants.find((p) => p.userId === currentUserId);
  const invitePending =
    event.phase === "scheduled" && mine?.status === "pending" && !isHost;
  const myInterested = mine?.status === "interested";
  const myNotInterested = mine?.status === "not_interested";

  const headerActions = (
    <div className="flex flex-wrap gap-2">
      {isHost && (
        <Button
          type="button"
          variant="outline"
          onClick={() => void duplicateCampaign()}
        >
          <Copy className="size-4" />
          Duplicate
        </Button>
      )}
      {event.phase === "scheduled" && (
        <CampaignShareMenu
          eventId={event.id}
          isHost={isHost}
          phase={event.phase}
        />
      )}
      <Button variant="secondary" asChild>
        <Link href="/events">Back to board</Link>
      </Button>
    </div>
  );

  const headerMeta = (
    <>
      {event.maxParticipants != null && (
        <PopIn key={`cap-${capCount}`}>
          <StatusBadge variant="overlap">
            {capCount} / {event.maxParticipants}{" "}
            {event.phase === "scheduled" ? "going" : "interested"}
          </StatusBadge>
        </PopIn>
      )}
      {costLine && (
        <StatusBadge variant="muted">{costLine}</StatusBadge>
      )}
    </>
  );

  return (
    <div className="campaign-detail mx-auto max-w-6xl space-y-5 pb-8 lg:space-y-6">
      {invitePending && (
        <CampaignRsvpBanner
          eventId={event.id}
          title={event.title}
          phase={event.phase}
          start={event.start}
          end={event.end}
          proposalCount={event.proposals.length}
          onUpdated={() => void reload()}
        />
      )}

      <CampaignHero
        title={event.title}
        subtitle={formatEventWhen(
          event.phase,
          event.start,
          event.end,
          event.proposals.length,
        )}
        phaseLabel={PHASE_LABELS[event.phase] ?? event.phase}
        meta={headerMeta}
        actions={headerActions}
        description={event.description}
      />

      {event.archivedAt && event.images.length > 0 && (
        <div className="space-y-2">
          <p className="font-display text-lg font-bold">Wall memories</p>
          <RecapPolaroidStrip images={event.images} />
        </div>
      )}

      {recap && (
        <CampaignSection variant="flat" title="Archived recap">
          <p className="text-sm text-[var(--paper-ink)]">
            {recap.participantSummary.accepted} accepted ·{" "}
            {recap.participantSummary.waitlisted} waitlisted · itinerary{" "}
            {recap.itineraryItemCount} items
          </p>
          {recap.expenseTotalCents > 0 && (
            <p className="mt-1 text-sm text-[var(--paper-ink-muted)]">
              Expenses logged: {(recap.expenseTotalCents / 100).toFixed(2)}
            </p>
          )}
        </CampaignSection>
      )}

      {isHost &&
        event.maxParticipants != null &&
        event.participants.some(
          (p) =>
            p.waitlistPosition != null &&
            p.status === "interested" &&
            p.userId,
        ) && (
          <CampaignSection variant="flat" title="Waitlist">
            <div className="flex flex-wrap items-center gap-2">
              <Button type="button" size="sm" onClick={() => void promoteFromWaitlist()}>
                Promote next
              </Button>
              <p className="text-xs text-[var(--paper-ink-muted)]">
                Moves the next numbered waitlist member into open capacity.
              </p>
            </div>
          </CampaignSection>
        )}

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(16rem,19rem)] lg:items-start lg:gap-6">
        <div className="min-w-0 space-y-5">
          {(event.phase === "interest" || event.phase === "scheduling") && (
            <CampaignSection
              id="campaign-interest"
              variant="sheet"
              title={
                event.phase === "interest" ? "Gather the squad" : "Poll in progress"
              }
              description={
                event.phase === "interest"
                  ? "Track who’s in, then open scheduling when you’re ready."
                  : "Vote on slots or add new ones until the host pins a time."
              }
            >
              <CampaignPhaseFlow
                phase={event.phase}
                isHost={isHost}
                participants={event.participants}
              />
              <div className="mt-5 border-t border-[var(--crayon-stroke)]/20 pt-5">
                <p className="mb-3 font-display text-lg font-bold text-[var(--paper-ink)]">
                  {event.phase === "interest" ? "Are you in?" : "Still in?"}
                </p>
                <CampaignInterestActions
                  phase={event.phase}
                  interested={myInterested}
                  notInterested={myNotInterested}
                  stampKey={interestStamp}
                  onInterested={() => void respondInterest("interested")}
                  onNotInterested={() => void respondInterest("not_interested")}
                />
              </div>
            </CampaignSection>
          )}

          {event.phase === "scheduled" && event.start && event.end && (
            <p className="rounded-sm border-2 border-primary/30 bg-primary/10 px-4 py-3 font-display text-lg font-bold text-[var(--paper-ink)]">
              Pinned: {formatShort(new Date(event.start))} –{" "}
              {formatShort(new Date(event.end))}
            </p>
          )}

          {isEndedForAttendance && participantUserIds.length > 0 && (
            <AttendanceStamps
              eventId={event.id}
              isHost={isHost}
              currentUserId={currentUserId}
              participantUserIds={participantUserIds}
            />
          )}

          <CampaignSection
            id="campaign-scheduling"
            variant="sheet"
            title="Schedule"
            description={
              event.phase === "interest"
                ? isHost
                  ? "Opens after you have interest — add slots and pin when ready."
                  : "The host will open time slots once enough of the squad responds."
                : "Propose times, vote, and finalize the session."
            }
          >
            <CampaignSchedulingPanel
              event={event}
              currentUserId={currentUserId}
              isHost={isHost}
              calendarEvents={calendarEvents}
              interestedCount={interestStats.interested.length}
              schedulingRosterCount={interestStats.schedulingRosterCount}
              onUpdated={handleSchedulingUpdated}
            />
          </CampaignSection>

          {(event.phase === "interest" || event.phase === "scheduling") && (
            <CampaignMoreOptions
              eventId={event.id}
              phase={event.phase}
              isHost={isHost}
              participants={event.participants.filter(
                (p): p is typeof p & { userId: string } => Boolean(p.userId),
              )}
              onChanged={() => void reload()}
            />
          )}

          {showExpenses && (
            <CampaignSection id="campaign-plans" variant="flat" title="Expenses">
              <CampaignExpensesTable
                eventId={event.id}
                phase={event.phase}
                isHost={isHost}
                costCurrency={event.costCurrency}
                costSplitEvenly={event.costSplitEvenly}
                payerCount={capCount}
                participants={event.participants
                  .filter((p): p is typeof p & { userId: string } => Boolean(p.userId))
                  .map((p) => ({
                    userId: p.userId,
                    name: p.user?.name ?? p.displayName ?? "Member",
                  }))}
                expenses={event.expenses}
                onUpdated={(patch) =>
                  setEvent((prev) => ({
                    ...prev,
                    expenses: patch.expenses,
                    costCurrency: patch.costCurrency,
                    costSplitEvenly: patch.costSplitEvenly,
                  }))
                }
              />
            </CampaignSection>
          )}

          {event.phase === "scheduled" && (
            <Button asChild className="w-full sm:w-auto">
              <Link href={`/events/${event.id}/plans`}>
                <ClipboardList className="size-4" />
                Open itinerary
              </Link>
            </Button>
          )}
        </div>

        <aside className="space-y-4 lg:sticky lg:top-20 lg:self-start">
          {isHost && (
            <HostPlaybook
              eventId={event.id}
              phase={event.phase}
              isHost={isHost}
              hasProposals={event.proposals.length > 0}
              isPinned={event.phase === "scheduled"}
            />
          )}

          <CampaignResourcesPanel
            eventId={event.id}
            resources={event.resources ?? []}
            isHost={isHost}
            onUpdated={() => void reload()}
          />

          <CampaignInvitePanel
            eventId={event.id}
            phase={event.phase}
            isHost={isHost}
            currentUserId={currentUserId}
            participants={event.participants}
            onUpdated={() => void reload()}
          />

          <CampaignSection
            variant="flat"
            title="Photos"
            description="Screenshots and references."
            action={
              <>
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) uploadImage(f);
                    e.target.value = "";
                  }}
                />
                <Button
                  type="button"
                  size="sm"
                  onClick={() => fileRef.current?.click()}
                >
                  Add photo
                </Button>
              </>
            }
          >
            {event.images.length === 0 ? (
              <p className="text-sm text-[var(--paper-ink-muted)]">
                Nothing attached yet — drop a map, flyer, or mood pic.
              </p>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                {event.images.map((img, i) => (
                  <button
                    key={img.id}
                    type="button"
                    className="block w-full cursor-zoom-in overflow-hidden rounded-sm border-2 border-[var(--crayon-stroke)] focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    onClick={() => {
                      setPhotoLightboxIndex(i);
                      setPhotoLightboxOpen(true);
                    }}
                  >
                    <Image
                      src={img.url}
                      alt=""
                      width={320}
                      height={200}
                      className="aspect-[4/3] w-full object-cover"
                      unoptimized
                    />
                  </button>
                ))}
              </div>
            )}
          </CampaignSection>
        </aside>
      </div>

      <ImageLightbox
        images={photoLightboxImages}
        open={photoLightboxOpen}
        index={photoLightboxIndex}
        onOpenChange={setPhotoLightboxOpen}
        onIndexChange={setPhotoLightboxIndex}
      />
    </div>
  );
}
