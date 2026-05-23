"use client";

import Link from "next/link";
import { PopIn } from "@/components/motion/pop-in";
import { Pressable } from "@/components/motion/pressable";
import { StaggerChildren, StaggerItem } from "@/components/motion/stagger-children";
import { StatusBadge } from "@/components/status-badge";
import { UserAvatar } from "@/components/user-avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BentoGrid, BentoTile } from "@/components/layout/bento-grid";
import { formatShort } from "@/lib/dates";
import { DashboardWeekStrip } from "@/components/calendar/dashboard-week-strip";
import { formatTime24 } from "@/lib/calendar";
import { format } from "date-fns";
import { useAppData } from "@/components/app-data-provider";
import { Calendar, Clock, Sparkles, Users } from "lucide-react";
import { timezoneCaption } from "@/lib/timezone-labels";
import { CopyPingButton } from "@/components/copy-ping-button";
import { OverlapPosterButton } from "@/components/overlap-poster-button";
import { createSoftHoldFromOverlap } from "@/components/soft-holds-panel";
import { SoftHoldsManageDialog } from "@/components/soft-holds-manage-dialog";

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

type DashboardBentoProps = {
  currentUserId: string;
  myBlockCount: number;
  teamBlockCount: number;
  pendingInvites?: number;
  overlaps: OverlapSlot[];
  events: EventRow[];
  userTimezone?: string | null;
};

export function DashboardBento({
  currentUserId,
  myBlockCount,
  teamBlockCount,
  pendingInvites: pendingProp,
  overlaps,
  events,
  userTimezone,
}: DashboardBentoProps) {
  const { pendingInvites: pendingFromCtx } = useAppData();
  const pendingInvites = pendingProp ?? pendingFromCtx;
  const featured = overlaps[0];
  const overlapDays = overlaps.map((o) =>
    format(new Date(o.start), "yyyy-MM-dd"),
  );

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <SoftHoldsManageDialog currentUserId={currentUserId} />
      </div>
    <BentoGrid>
      <BentoTile span={2} className="lg:col-span-2">
        <Pressable hoverWiggle className="block h-full">
        <Card tiltId="featured-overlap" interactive className="h-full border-overlap/40">
          <CardHeader>
            <CardTitle>Next shared window</CardTitle>
            <CardDescription>
              {featured
                ? "Pinned where the squad overlaps this week"
                : "No overlap yet — add crayon on the calendar"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {featured ? (
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="flex -space-x-2">
                    {featured.users.slice(0, 5).map((u, i) => (
                      <PopIn key={u.id} delay={i * 0.06}>
                        <UserAvatar
                          name={u.name}
                          image={u.image}
                          size="sm"
                        />
                      </PopIn>
                    ))}
                  </div>
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <StatusBadge variant="overlap">
                        {featured.count} available
                      </StatusBadge>
                      {featured.unicorn && (
                        <StatusBadge variant="muted" className="gap-1">
                          <Sparkles className="size-3.5 text-amber-500" />
                          Unicorn
                        </StatusBadge>
                      )}
                    </div>
                    <p className="mt-2 font-display text-xl font-bold tabular-nums">
                      {formatTime24(new Date(featured.start))} –{" "}
                      {formatTime24(new Date(featured.end))}
                    </p>
                    <p className="mt-0.5 text-xs text-[var(--paper-ink-muted)]">
                      {timezoneCaption(userTimezone)}
                    </p>
                  </div>
                </div>
                <div className="flex flex-col items-stretch gap-2 sm:items-end">
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
                  <Button asChild size="sm">
                    <Link
                      href={`/events?start=${encodeURIComponent(featured.start)}&end=${encodeURIComponent(featured.end)}`}
                    >
                      Start campaign
                    </Link>
                  </Button>
                </div>
              </div>
            ) : (
              <Button asChild variant="outline">
                <Link href="/availability">Open calendar</Link>
              </Button>
            )}
            <DashboardWeekStrip
              highlightDays={overlapDays}
              events={events}
            />
          </CardContent>
        </Card>
        </Pressable>
      </BentoTile>

      <BentoTile>
        <Pressable hoverWiggle className="block h-full">
        <Card tiltId="stat-my" interactive className="h-full">
          <CardContent className="flex h-full items-center gap-3 pt-6">
            <Clock className="h-9 w-9 text-primary" />
            <div>
              <PopIn delay={0.05}>
              <p className="font-display text-4xl font-bold tabular-nums">{myBlockCount}</p>
              </PopIn>
              <p className="ink-label">Your crayon blocks</p>
            </div>
          </CardContent>
        </Card>
        </Pressable>
      </BentoTile>

      <BentoTile>
        <Pressable hoverWiggle className="block h-full">
        <Card tiltId="stat-team" interactive className="h-full">
          <CardContent className="flex h-full items-center gap-3 pt-6">
            <Users className="h-9 w-9 text-secondary" />
            <div>
              <PopIn delay={0.1}>
              <p className="font-display text-4xl font-bold tabular-nums">{teamBlockCount}</p>
              </PopIn>
              <p className="ink-label">Team blocks</p>
            </div>
          </CardContent>
        </Card>
        </Pressable>
      </BentoTile>

      <BentoTile span={2} rowSpan={2} className="lg:col-span-2 lg:row-span-2">
        <Card tiltId="events-list" className="flex h-full min-h-[280px] flex-col">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Upcoming events</CardTitle>
              <CardDescription>Notes on the wall</CardDescription>
            </div>
            <Button asChild variant="ghost-accent" size="sm">
              <Link href="/events">All</Link>
            </Button>
          </CardHeader>
          <CardContent className="flex-1">
            {events.length === 0 ? (
              <p className="font-sans text-muted-foreground">No upcoming events.</p>
            ) : (
              <ul className="space-y-2">
                {events.map((event) => (
                  <li
                    key={event.id}
                    className="paper-sheet flex items-start gap-3 p-3"
                    style={{ "--paper-tilt": `${(event.id.charCodeAt(0) % 5) - 2}deg` } as React.CSSProperties}
                  >
                    <UserAvatar
                      name={event.createdBy.name}
                      image={event.createdBy.image}
                      size="sm"
                    />
                    <div>
                      <p className="font-display text-lg font-bold">{event.title}</p>
                      <p className="font-sans text-sm text-muted-foreground">
                        {event.start
                          ? formatShort(event.start)
                          : "TBD"}{" "}
                        · {event.createdBy.name ?? "Host"}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </BentoTile>

      <BentoTile>
        <Pressable hoverWiggle className="block h-full">
        <Card tiltId="stat-invites" interactive className="h-full">
          <CardContent className="flex h-full items-center gap-3 pt-6">
            <Calendar className="h-9 w-9 text-muted-foreground" />
            <div>
              <PopIn delay={0.15}>
              <p className="font-display text-4xl font-bold tabular-nums">{pendingInvites}</p>
              </PopIn>
              <p className="ink-label">Invites</p>
            </div>
          </CardContent>
        </Card>
        </Pressable>
      </BentoTile>

      {overlaps.length > 1 && (
        <BentoTile span={2} className="lg:col-span-2">
          <Card tiltId="more-overlaps">
            <CardHeader className="pb-2">
              <CardTitle className="text-xl">More overlaps</CardTitle>
            </CardHeader>
            <CardContent>
              <StaggerChildren className="space-y-2">
                {overlaps.slice(1).map((slot) => (
                  <StaggerItem key={slot.start}>
                    <div className="paper-sheet flex flex-wrap items-center justify-between gap-2 p-3">
                      <StatusBadge variant="overlap">{slot.count} available</StatusBadge>
                      <span className="font-sans text-sm tabular-nums text-muted-foreground">
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
                    </div>
                  </StaggerItem>
                ))}
              </StaggerChildren>
            </CardContent>
          </Card>
        </BentoTile>
      )}
    </BentoGrid>
    </div>
  );
}
