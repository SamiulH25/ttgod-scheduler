"use client";



import { format } from "date-fns";

import { HolidayDayLayer } from "@/components/calendar/holiday-day-layer";

import { WeatherHourLayer } from "@/components/calendar/weather-hour-layer";

import { CrayonBlock } from "@/components/paper/crayon-block";

import {

  ContextMenu,

  ContextMenuContent,

  ContextMenuItem,

  ContextMenuTrigger,

} from "@/components/ui/context-menu";

import type { HourWeather } from "@/lib/weather/types";

import {

  formatTime24,

  getViewportHours,

  minutesToDate,

  type CalendarBlock,

  type CalendarViewport,

} from "@/lib/calendar";

import {

  getEventSegmentsForDay,

  intervalSegmentForDay,

  segmentPositionClass,

} from "@/lib/event-calendar-segments";

import type { EventTimeRange } from "@/lib/event-conflicts";

import type { DragRange } from "@/components/calendar/hooks/use-week-pointer";

import { cn } from "@/lib/utils";



export type ProposalSegment = {

  id: string;

  start: string;

  end: string;

  title: string;

  color: string;

  voteCount?: number;

  dashed?: boolean;

};



type EventDayColumnProps = {

  day: Date;

  events: EventTimeRange[];

  proposals?: ProposalSegment[];

  ghostBlocks?: CalendarBlock[];

  viewport: CalendarViewport;

  start: string;

  end: string;

  dragRange: DragRange | null;

  commitFlash?: boolean;

  conflictingEventIds?: Set<string>;

  hourWeather?: HourWeather[];

  holidayName?: string;

  interactiveProposals?: boolean;

  onRemoveProposal?: (proposalId: string) => void;

  onClearPreview?: () => void;

};



export function EventDayColumn({

  day,

  events,

  proposals = [],

  ghostBlocks = [],

  viewport,

  start,

  end,

  dragRange,

  commitFlash,

  conflictingEventIds,

  hourWeather,

  holidayName,

  interactiveProposals = false,

  onRemoveProposal,

  onClearPreview,

}: EventDayColumnProps) {

  const columnHeight = viewport.heightPx;

  const dayKey = format(day, "yyyy-MM-dd");

  const isToday = dayKey === format(new Date(), "yyyy-MM-dd");

  const hourLabels = getViewportHours(viewport);

  const existing = getEventSegmentsForDay(day, events, viewport);



  const selection =

    start && end

      ? intervalSegmentForDay(day, new Date(start), new Date(end), viewport, {

          eventId: "__selection__",

          title: "New slot",

          color: "var(--primary)",

        })

      : null;



  const dragSegments = dragRange

    ? intervalSegmentForDay(day, dragRange.start, dragRange.end, viewport, {

        eventId: "__drag__",

        title: "New slot",

        color: "var(--primary)",

      })

    : null;



  const proposalSegments = proposals

    .map((p) => {

      const seg = intervalSegmentForDay(

        day,

        new Date(p.start),

        new Date(p.end),

        viewport,

        {

          eventId: p.id,

          title: p.title,

          color: p.color,

        },

      );

      return seg ? { ...seg, proposal: p } : null;

    })

    .filter((x): x is NonNullable<typeof x> => x !== null);



  const ghostSegments = ghostBlocks.flatMap((b) => {

    const seg = intervalSegmentForDay(

      day,

      new Date(b.start),

      new Date(b.end),

      viewport,

      {

        eventId: `ghost-${b.id}`,

        title: b.user.name ?? "Free",

        color: "var(--paper-ink-muted)",

      },

    );

    return seg ? [seg] : [];

  });



  const canClearPreview = Boolean(onClearPreview && start && end);



  return (

    <div

      data-day-column

      data-day={dayKey}

      aria-label={format(day, "EEEE, MMMM d")}

      className={cn(

        "paper-calendar-day-column relative touch-none select-none overflow-hidden border-l border-[var(--crayon-stroke)]/25",

        isToday && "paper-calendar-day-column--today",

      )}

      style={{ height: columnHeight }}

      onContextMenu={(e) => e.preventDefault()}

    >

      <HolidayDayLayer holidayName={holidayName} />



      {hourLabels.map((hour) => (

        <div

          key={hour}

          className={cn(

            "absolute left-0 right-0 border-t",

            hour % 2 === 0

              ? "border-[var(--crayon-stroke)]/15"

              : "border-[var(--crayon-stroke)]/8",

          )}

          style={{

            top: `${((hour * 60 - viewport.startMin) / viewport.durationMin) * 100}%`,

          }}

        />

      ))}



      {ghostSegments.map((seg) => (

        <CrayonBlock

          key={`ghost-${seg.eventId}-${seg.startMin}`}

          color={seg.color}

          variant="fill"

          className={cn(

            "pointer-events-none left-0.5 right-0.5 z-0 opacity-25",

            segmentPositionClass(seg.position),

          )}

          style={{

            top: `${seg.topPercent}%`,

            height: `${seg.heightPercent}%`,

          }}

        />

      ))}



      {existing.map((seg) => (

        <CrayonBlock

          key={`${seg.eventId}-${seg.startMin}-${seg.position}`}

          color={seg.color}

          variant="fill"

          className={cn(

            "pointer-events-none left-0.5 right-0.5 z-[1] opacity-85",

            segmentPositionClass(seg.position),

            conflictingEventIds?.has(seg.eventId) &&

              "z-[2] ring-2 ring-destructive ring-offset-1 animate-wiggle-once",

          )}

          style={{

            top: `${seg.topPercent}%`,

            height: `${seg.heightPercent}%`,

          }}

          title={seg.title}

        >

          {(seg.position === "start" || seg.position === "single") && (

            <span className="block truncate px-1 font-display text-[10px] font-bold leading-tight">

              {seg.title}

            </span>

          )}

        </CrayonBlock>

      ))}



      {proposalSegments.map(({ proposal, ...seg }) => {

        const crayon = (

          <CrayonBlock

            color={seg.color}

            variant="preview"

            className={cn(

              "left-0.5 right-0.5 z-[2] border-dashed opacity-90",

              segmentPositionClass(seg.position),

              interactiveProposals && onRemoveProposal

                ? "pointer-events-auto cursor-pointer hover:brightness-105"

                : "pointer-events-none",

            )}

            style={{

              top: `${seg.topPercent}%`,

              height: `${seg.heightPercent}%`,

            }}

            title={seg.title}

          >

            {(seg.position === "start" || seg.position === "single") && (

              <span className="block truncate px-1 font-display text-[10px] font-bold">

                {proposal.voteCount != null

                  ? `${proposal.voteCount} votes`

                  : "Proposal"}

              </span>

            )}

          </CrayonBlock>

        );



        if (interactiveProposals && onRemoveProposal) {

          return (

            <ContextMenu key={`proposal-${seg.eventId}-${seg.startMin}`}>

              <ContextMenuTrigger asChild>{crayon}</ContextMenuTrigger>

              <ContextMenuContent>

                <ContextMenuItem

                  variant="destructive"

                  onSelect={() => onRemoveProposal(proposal.id)}

                >

                  Remove slot

                </ContextMenuItem>

              </ContextMenuContent>

            </ContextMenu>

          );

        }



        return (

          <div key={`proposal-${seg.eventId}-${seg.startMin}`} className="contents">

            {crayon}

          </div>

        );

      })}



      {selection && !dragRange && (() => {

        const previewBlock = (

          <CrayonBlock

            variant="preview"

            color="var(--primary)"

            className={cn(

              "left-0.5 right-0.5 z-[3] border-primary",

              segmentPositionClass(selection.position),

              commitFlash && "animate-proposal-flash",

              canClearPreview && "pointer-events-auto cursor-pointer",

            )}

            style={{

              top: `${selection.topPercent}%`,

              height: `${selection.heightPercent}%`,

            }}

          >

            {(selection.position === "start" || selection.position === "single") && (

              <span className="absolute left-0.5 top-0 font-display text-[10px] font-bold">

                {formatTime24(minutesToDate(day, selection.startMin))} –{" "}

                {formatTime24(minutesToDate(day, selection.endMin))}

              </span>

            )}

          </CrayonBlock>

        );



        if (canClearPreview) {

          return (

            <ContextMenu key="selection-preview">

              <ContextMenuTrigger asChild>{previewBlock}</ContextMenuTrigger>

              <ContextMenuContent>

                <ContextMenuItem

                  onSelect={() => onClearPreview?.()}

                >

                  Clear preview

                </ContextMenuItem>

              </ContextMenuContent>

            </ContextMenu>

          );

        }



        return (

          <div key="selection-preview" className="contents">

            {previewBlock}

          </div>

        );

      })()}



      {dragSegments && (

        <CrayonBlock

          variant="preview"

          color="var(--primary)"

          className={cn(

            "pointer-events-none left-0.5 right-0.5 z-[4]",

            segmentPositionClass(dragSegments.position),

            "animate-drag-pulse",

          )}

          style={{

            top: `${dragSegments.topPercent}%`,

            height: `${dragSegments.heightPercent}%`,

          }}

        />

      )}



      <WeatherHourLayer

        dayKey={dayKey}

        viewport={viewport}

        hours={hourWeather}

      />

    </div>

  );

}

