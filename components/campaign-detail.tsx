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
import { CampaignMoreOptions } from "@/components/campaign-more-options";
import { CampaignShareMenu } from "@/components/campaign-share-menu";
import { AttendanceStamps } from "@/components/attendance-stamps";
import { RecapPolaroidStrip } from "@/components/recap-polaroid-strip";
import { PageHeader } from "@/components/page-header";
import { StatusBadge } from "@/components/status-badge";
import { UserAvatar } from "@/components/user-avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { countTowardCap } from "@/lib/campaign-capacity";
import { PopIn } from "@/components/motion/pop-in";
import { StampMotion } from "@/components/motion/stamp-pop";
import { formatCostLineFromExpenses } from "@/lib/campaign-cost";
import { canEditExpenses } from "@/lib/event-expenses";
import { formatEventWhen, formatShort } from "@/lib/dates";
import type { EventRecap } from "@/lib/event-recap";
import { ClipboardList, Copy, UserPlus } from "lucide-react";

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
  const [guestEmail, setGuestEmail] = useState("");
  const [guestName, setGuestName] = useState("");

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

  async function addGuest(e: React.FormEvent) {
    e.preventDefault();
    if (!guestEmail.trim() || !guestName.trim()) return;
    const res = await fetch(`/api/events/${event.id}/guests`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        guestEmail: guestEmail.trim(),
        displayName: guestName.trim(),
      }),
    });
    if (!res.ok) {
      toast.error("Could not add guest");
      return;
    }
    toast.success("Guest invited");
    setGuestEmail("");
    setGuestName("");
    reload();
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={event.title}
        subtitle={formatEventWhen(
          event.phase,
          event.start,
          event.end,
          event.proposals.length,
        )}
        action={
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
            <Button variant="outline" asChild>
              <Link href="/events">Back to board</Link>
            </Button>
          </div>
        }
      />

      <div className="flex flex-wrap gap-2">
        <PopIn key={event.phase}>
          <StatusBadge variant="muted">{PHASE_LABELS[event.phase] ?? event.phase}</StatusBadge>
        </PopIn>
        {event.maxParticipants != null && (
          <StatusBadge variant="overlap">
            {capCount} / {event.maxParticipants}{" "}
            {event.phase === "scheduled" ? "going" : "interested"}
          </StatusBadge>
        )}
        {costLine && <StatusBadge variant="muted">{costLine}</StatusBadge>}
      </div>

      {event.description && (
        <p className="text-sm text-muted-foreground">{event.description}</p>
      )}

      {event.archivedAt && event.images.length > 0 && (
        <div className="space-y-2">
          <p className="font-display text-lg font-bold">Wall memories</p>
          <RecapPolaroidStrip images={event.images} />
        </div>
      )}

      {recap && (
        <Card tiltId="campaign-recap" tape>
          <CardHeader>
            <CardTitle>Archived recap</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p>
              {recap.participantSummary.accepted} accepted ·{" "}
              {recap.participantSummary.waitlisted} waitlisted · itinerary{" "}
              {recap.itineraryItemCount} items
            </p>
            {recap.expenseTotalCents > 0 && (
              <p className="text-muted-foreground">
                Expenses logged: {(recap.expenseTotalCents / 100).toFixed(2)}
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {isHost &&
        event.maxParticipants != null &&
        event.participants.some(
          (p) =>
            p.waitlistPosition != null &&
            p.status === "interested" &&
            p.userId,
        ) && (
          <Card tiltId="campaign-waitlist">
            <CardHeader>
              <CardTitle>Waitlist</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-wrap items-center gap-2">
              <Button type="button" size="sm" onClick={() => void promoteFromWaitlist()}>
                Promote next
              </Button>
              <p className="text-xs text-muted-foreground">
                Moves the next numbered waitlist member into open capacity.
              </p>
            </CardContent>
          </Card>
        )}

      {isHost && (
        <Card tiltId="campaign-guest">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserPlus className="size-4" />
              Add guest
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={addGuest} className="flex flex-wrap gap-2">
              <div className="min-w-[10rem] flex-1 space-y-1">
                <Label htmlFor="g-name">Display name</Label>
                <Input
                  id="g-name"
                  value={guestName}
                  onChange={(e) => setGuestName(e.target.value)}
                  required
                />
              </div>
              <div className="min-w-[12rem] flex-1 space-y-1">
                <Label htmlFor="g-email">Email</Label>
                <Input
                  id="g-email"
                  type="email"
                  value={guestEmail}
                  onChange={(e) => setGuestEmail(e.target.value)}
                  required
                />
              </div>
              <Button type="submit" className="self-end">
                Invite
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      {event.phase === "scheduled" && event.start && event.end && (
        <p className="font-display text-lg font-bold">
          {formatShort(new Date(event.start))} – {formatShort(new Date(event.end))}
        </p>
      )}

      {(event.phase === "interest" || event.phase === "scheduling") && (
        <Card tiltId="campaign-interest">
          <CardHeader>
            <CardTitle>Your response</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            {(() => {
              const mine = event.participants.find(
                (p) => p.userId === currentUserId,
              );
              const interested = mine?.status === "interested";
              const notInterested = mine?.status === "not_interested";
              return (
                <>
                  <StampMotion animationKey={interestStamp}>
                    <Button
                      type="button"
                      variant={interested ? "default" : "outline"}
                      onClick={() => respondInterest("interested")}
                    >
                      Yes, interested
                    </Button>
                  </StampMotion>
                  <StampMotion animationKey={interestStamp}>
                    <Button
                      type="button"
                      variant={notInterested ? "default" : "outline"}
                      onClick={() => respondInterest("not_interested")}
                    >
                      Not interested
                    </Button>
                  </StampMotion>
                </>
              );
            })()}
          </CardContent>
        </Card>
      )}

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

      {isEndedForAttendance && participantUserIds.length > 0 && (
        <AttendanceStamps
          eventId={event.id}
          isHost={isHost}
          currentUserId={currentUserId}
          participantUserIds={participantUserIds}
        />
      )}

      {showExpenses && (
        <Card tiltId="campaign-expenses">
          <CardHeader>
            <CardTitle>Expenses</CardTitle>
          </CardHeader>
          <CardContent>
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
          </CardContent>
        </Card>
      )}

      <Card tiltId="campaign-schedule">
        <CardHeader>
          <CardTitle>Schedule</CardTitle>
        </CardHeader>
        <CardContent>
          <CampaignSchedulingPanel
            event={event}
            currentUserId={currentUserId}
            isHost={isHost}
            calendarEvents={calendarEvents}
            onUpdated={handleSchedulingUpdated}
          />
        </CardContent>
      </Card>

      {event.phase === "scheduled" && (
        <Button asChild>
          <Link href={`/events/${event.id}/plans`}>
            <ClipboardList className="size-4" />
            Open itinerary
          </Link>
        </Button>
      )}

      <Card tiltId="campaign-photos">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Photos</CardTitle>
          <div>
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
            <Button type="button" size="sm" onClick={() => fileRef.current?.click()}>
              Add photo
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {event.images.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Attach screenshots or references anytime.
            </p>
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {event.images.map((img, i) => (
                <button
                  key={img.id}
                  type="button"
                  className="paper-sheet block w-full cursor-zoom-in overflow-hidden focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
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
                    className="h-32 w-full object-cover"
                    unoptimized
                  />
                </button>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <ImageLightbox
        images={photoLightboxImages}
        open={photoLightboxOpen}
        index={photoLightboxIndex}
        onOpenChange={setPhotoLightboxOpen}
        onIndexChange={setPhotoLightboxIndex}
      />

      <Card tiltId="campaign-squad">
        <CardHeader>
          <CardTitle>Squad</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          {event.participants.map((p) => (
            <div
              key={p.userId ?? p.guestEmail ?? p.id ?? "guest"}
              className="flex items-center gap-2 text-sm"
            >
              <UserAvatar
                name={p.user?.name ?? p.displayName ?? p.guestEmail ?? "Guest"}
                image={p.user?.image ?? null}
                size="xs"
              />
              <span>
                {p.user?.name ?? p.displayName ?? p.guestEmail ?? "Guest"} ·{" "}
                {p.status}
                {p.waitlistPosition != null ? ` · WL #${p.waitlistPosition}` : ""}
              </span>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
