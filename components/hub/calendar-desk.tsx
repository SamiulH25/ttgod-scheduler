"use client";

import Link from "next/link";
import { format } from "date-fns";
import { Calendar, Clock, Sparkles, Users } from "lucide-react";
import { PopIn } from "@/components/motion/pop-in";
import { PaperSurface } from "@/components/paper/paper-surface";
import { DashboardWeekStrip } from "@/components/calendar/dashboard-week-strip";
import { StatusBadge } from "@/components/status-badge";
import { UserAvatar } from "@/components/user-avatar";
import { Button } from "@/components/ui/button";
import { formatShort } from "@/lib/dates";
import { formatTime24, getWeekStart } from "@/lib/calendar";
import { timezoneCaption } from "@/lib/timezone-labels";
import { CopyPingButton } from "@/components/copy-ping-button";
import { OverlapPosterButton } from "@/components/overlap-poster-button";
import { createSoftHoldFromOverlap } from "@/components/soft-holds-panel";

type OverlapSlot = {
  start: string;
  end: string;
  count: number;
  users: { id: string; name: string | null; image: string | null }[];
  unicorn?: boolean;
};

type EventRow = {
  id: string;
  title: string;
  start: Date | null;
  createdBy: { name: string | null; image: string | null };
};

type HubCalendarDeskProps = {
  myBlockCount: number;
  teamBlockCount: number;
  pendingInvites: number;
  overlaps: OverlapSlot[];
  events: EventRow[];
  userTimezone?: string | null;
};

export function HubCalendarDesk({
  myBlockCount,
  teamBlockCount,
  pendingInvites,
  overlaps,
  events,
  userTimezone,
}: HubCalendarDeskProps) {
  const featured = overlaps[0];
  const overlapDays = overlaps.map((o) => format(new Date(o.start), "yyyy-MM-dd"));
  const weekStart = getWeekStart(new Date());
  const monthLabel = format(weekStart, "MMMM");

  return (
    <div className="grid gap-6 lg:grid-cols-12">
      <div className="lg:col-span-7">
        <section className="calendar-pad">
          <div className="calendar-pad-spiral" aria-hidden />
          <div className="calendar-pad-body">
            <div className="calendar-pad-header tear-off-sheet mb-3 px-4 py-3">
              <p className="font-display text-2xl font-bold text-[var(--paper-ink)]">
                {monthLabel}
              </p>
              <p className="font-sans text-xs text-[var(--paper-ink-muted)]">
                Squad week at a glance
              </p>
              <DashboardWeekStrip
                highlightDays={overlapDays}
                events={events}
                className="mt-3"
              />
            </div>
            <div className="calendar-pad-grid-area ruled-paper px-3 py-4">
              <p className="ink-label mb-3">This week on the pad</p>
              <div className="grid grid-cols-3 gap-3">
                <StatChip icon={Clock} value={myBlockCount} label="Your blocks" />
                <StatChip icon={Users} value={teamBlockCount} label="Team blocks" />
                <StatChip icon={Calendar} value={pendingInvites} label="Invites" />
              </div>
            </div>
          </div>
        </section>
      </div>

      <div className="flex flex-col gap-4 lg:col-span-5">
        <PaperSurface variant="tearOff" tiltId="hub-overlap" className="p-5">
          <p className="prose-label">Tear-off · next overlap</p>
          {featured ? (
            <>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <StatusBadge variant="overlap">{featured.count} available</StatusBadge>
                {featured.unicorn && (
                  <StatusBadge variant="muted" className="gap-1">
                    <Sparkles className="size-3.5 text-amber-500" />
                    Unicorn
                  </StatusBadge>
                )}
              </div>
              <p className="mt-3 font-display text-2xl font-bold tabular-nums">
                {formatTime24(new Date(featured.start))} –{" "}
                {formatTime24(new Date(featured.end))}
              </p>
              <p className="text-xs text-[var(--paper-ink-muted)]">
                {timezoneCaption(userTimezone)}
              </p>
              <div className="mt-3 flex -space-x-2">
                {featured.users.slice(0, 6).map((u, i) => (
                  <PopIn key={u.id} delay={i * 0.05}>
                    <UserAvatar name={u.name} image={u.image} size="sm" />
                  </PopIn>
                ))}
              </div>
              <div className="mt-4 flex flex-col gap-2">
                <CopyPingButton
                  title="Shared window"
                  start={featured.start}
                  end={featured.end}
                  people={featured.users}
                />
                <OverlapPosterButton start={featured.start} end={featured.end} />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    void createSoftHoldFromOverlap(
                      "Squad session",
                      featured.start,
                      featured.end,
                    )
                  }
                >
                  Hold window
                </Button>
                <Button asChild>
                  <Link
                    href={`/events?start=${encodeURIComponent(featured.start)}&end=${encodeURIComponent(featured.end)}`}
                  >
                    Start campaign
                  </Link>
                </Button>
              </div>
            </>
          ) : (
            <p className="mt-3 font-sans text-sm text-muted-foreground">
              No overlap yet — add crayon on the calendar.
            </p>
          )}
          <Button asChild variant="outline" size="sm" className="mt-4 w-full">
            <Link href="/availability">Open full calendar</Link>
          </Button>
        </PaperSurface>

        {overlaps.length > 1 && (
          <PaperSurface variant="sheet" tiltId="hub-more-overlaps" className="p-4">
            <p className="font-display text-lg font-bold">More overlaps</p>
            <ul className="mt-2 space-y-2">
              {overlaps.slice(1, 4).map((slot) => (
                <li
                  key={slot.start}
                  className="flex flex-wrap items-center justify-between gap-2 border-b border-dashed border-[var(--ruled-line)] pb-2 last:border-0"
                >
                  <span className="font-sans text-sm tabular-nums">
                    {formatTime24(new Date(slot.start))}–
                    {formatTime24(new Date(slot.end))}
                  </span>
                  <Button asChild size="sm" variant="sticker">
                    <Link
                      href={`/events?start=${encodeURIComponent(slot.start)}&end=${encodeURIComponent(slot.end)}`}
                    >
                      Plan
                    </Link>
                  </Button>
                </li>
              ))}
            </ul>
          </PaperSurface>
        )}
      </div>

      <PaperSurface
        variant="sheet"
        tiltId="hub-events-list"
        tapeCorner="bl"
        attachment="tapeCorner"
        className="ruled-list-sheet p-5 lg:col-span-12"
      >
        <div className="mb-3 flex items-center justify-between gap-2">
          <p className="font-display text-xl font-bold">Pinned this week</p>
          <Button asChild variant="ghost-accent" size="sm">
            <Link href="/events">All campaigns</Link>
          </Button>
        </div>
        {events.length === 0 ? (
          <p className="font-sans text-sm text-muted-foreground">No upcoming sessions.</p>
        ) : (
          <ul>
            {events.map((event) => (
              <li key={event.id} className="flex items-start gap-3">
                <UserAvatar
                  name={event.createdBy.name}
                  image={event.createdBy.image}
                  size="sm"
                />
                <div>
                  <p className="font-display text-lg font-bold">{event.title}</p>
                  <p className="font-sans text-sm text-muted-foreground">
                    {event.start ? formatShort(event.start) : "TBD"} ·{" "}
                    {event.createdBy.name ?? "Host"}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </PaperSurface>
    </div>
  );
}

function StatChip({
  icon: Icon,
  value,
  label,
}: {
  icon: typeof Clock;
  value: number;
  label: string;
}) {
  return (
    <div className="text-center">
      <Icon className="mx-auto h-6 w-6 text-primary" aria-hidden />
      <p className="mt-1 font-display text-2xl font-bold tabular-nums">{value}</p>
      <p className="ink-label text-[10px]">{label}</p>
    </div>
  );
}
