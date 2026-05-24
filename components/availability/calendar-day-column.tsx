"use client";

import { memo, useRef, useState } from "react";
import { format } from "date-fns";
import { CrayonBlock } from "@/components/paper/crayon-block";
import { StatusBadge } from "@/components/status-badge";
import { UserAvatar } from "@/components/user-avatar";
import {
  blockVisualTier,
  buildDayLayout,
  clipIntervalToViewport,
  colorForUser,
  formatTime24,
  getViewportHours,
  MAX_CALENDAR_OVERLAP,
  minutesToDate,
  type CalendarBlock,
  type CalendarViewport,
  type OverlapBand,
  yToMinutesInViewport,
  type SoloRect,
} from "@/lib/calendar";
import { HolidayDayLayer } from "@/components/calendar/holiday-day-layer";
import { WeatherHourLayer } from "@/components/calendar/weather-hour-layer";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import type { AvailabilityViewFilter } from "@/lib/availability-stats";
import type { HourWeather } from "@/lib/weather/types";
import { cn } from "@/lib/utils";

const DRAG_THRESHOLD_PX = 6;

export type DragPreview = {
  day: Date;
  startMin: number;
  endMin: number;
};

function blockStyle(topPercent: number, heightPercent: number) {
  return {
    top: `${topPercent}%`,
    height: `${heightPercent}%`,
    minHeight: heightPercent < 0.4 ? 3 : undefined,
  };
}

function blockDimmed(
  userId: string,
  filter: AvailabilityViewFilter,
  focusedUserId: string | null,
  currentUserId: string,
): boolean {
  if (filter === "mine" && userId !== currentUserId) return true;
  if (focusedUserId && userId !== focusedUserId) return true;
  return false;
}

type CalendarDayColumnProps = {
  day: Date;
  blocks: CalendarBlock[];
  currentUserId: string;
  viewport: CalendarViewport;
  filter: AvailabilityViewFilter;
  focusedUserId: string | null;
  highlightBlockId?: string | null;
  showNowLine?: boolean;
  hourWeather?: HourWeather[];
  holidayName?: string;
  onSoloClick: (rect: SoloRect, e: React.MouseEvent) => void;
  onSoloEdit?: (block: CalendarBlock) => void;
  onSoloRemove?: (blockId: string) => void;
  onOverlapClick: (band: OverlapBand, day: Date, e: React.MouseEvent) => void;
  onDragStart: (day: Date, offsetY: number) => void;
  onDragMove: (offsetY: number) => void;
  onDragEnd: (day: Date, startY: number, endY: number, didDrag: boolean) => void;
};

function CalendarDayColumnInner({
  day,
  blocks,
  currentUserId,
  viewport,
  filter,
  focusedUserId,
  highlightBlockId,
  showNowLine,
  hourWeather,
  holidayName,
  onSoloClick,
  onSoloEdit,
  onSoloRemove,
  onOverlapClick,
  onDragStart,
  onDragMove,
  onDragEnd,
}: CalendarDayColumnProps) {
  const columnHeight = viewport.heightPx;
  const hourLabels = getViewportHours(viewport);
  const columnRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef({
    active: false,
    didDrag: false,
    startY: 0,
    lastY: 0,
  });

  const [localPreview, setLocalPreview] = useState<DragPreview | null>(null);
  const anchorMinRef = useRef<number | null>(null);

  const { soloRects, overlapBands } = buildDayLayout(day, blocks);
  const dayKey = format(day, "yyyy-MM-dd");
  const isToday = dayKey === format(new Date(), "yyyy-MM-dd");
  const showPreview = localPreview !== null;
  const overlapCount = overlapBands.length;

  const nowLinePct =
    showNowLine && isToday
      ? (() => {
          const now = new Date();
          const min = now.getHours() * 60 + now.getMinutes();
          if (min < viewport.startMin || min > viewport.endMin) return null;
          return ((min - viewport.startMin) / viewport.durationMin) * 100;
        })()
      : null;

  const handlePointerDown = (e: React.PointerEvent) => {
    if (e.button !== 0) return;
    if ((e.target as HTMLElement).closest("[data-block-id]")) return;
    const rect = columnRef.current?.getBoundingClientRect();
    if (!rect) return;

    dragRef.current = {
      active: true,
      didDrag: false,
      startY: e.clientY - rect.top,
      lastY: e.clientY - rect.top,
    };

    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    const startMin = yToMinutesInViewport(
      dragRef.current.startY,
      columnHeight,
      viewport,
    );
    anchorMinRef.current = startMin;
    setLocalPreview({ day, startMin, endMin: startMin + 60 });
    onDragStart(day, dragRef.current.startY);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!dragRef.current.active) return;
    const rect = columnRef.current?.getBoundingClientRect();
    if (!rect) return;

    const y = e.clientY - rect.top;
    if (Math.abs(y - dragRef.current.startY) > DRAG_THRESHOLD_PX) {
      dragRef.current.didDrag = true;
    }
    dragRef.current.lastY = y;
    const anchor = anchorMinRef.current;
    if (anchor !== null) {
      const currentMin = yToMinutesInViewport(y, columnHeight, viewport);
      const startMin = Math.min(anchor, currentMin);
      const endMin = Math.max(anchor, currentMin, startMin + 30);
      setLocalPreview({
        day,
        startMin,
        endMin: Math.min(endMin, viewport.endMin),
      });
    }
    onDragMove(y);
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (!dragRef.current.active) return;
    const rect = columnRef.current?.getBoundingClientRect();
    if (!rect) return;

    const endY = e.clientY - rect.top;
    const { didDrag, startY } = dragRef.current;
    dragRef.current.active = false;
    setLocalPreview(null);
    anchorMinRef.current = null;

    (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
    onDragEnd(day, startY, endY, didDrag);
  };

  return (
    <div
      ref={columnRef}
      className={cn(
        "paper-calendar-day-column relative z-0 touch-none select-none overflow-hidden border-l border-[var(--crayon-stroke)]/25",
        isToday && "paper-calendar-day-column--today",
      )}
      style={{ height: columnHeight }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
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

      {nowLinePct != null && (
        <div
          className="pointer-events-none absolute left-0 right-0 z-[4] border-t-2 border-primary"
          style={{ top: `${nowLinePct}%` }}
          aria-hidden
        >
          <span className="absolute -left-1 top-0 size-2 -translate-y-1/2 rounded-full bg-primary" />
        </div>
      )}

      {showPreview && localPreview && (() => {
        const clip = clipIntervalToViewport(
          localPreview.startMin,
          localPreview.endMin,
          viewport,
        );
        if (!clip) return null;
        return (
          <CrayonBlock
            variant="preview"
            color={colorForUser(currentUserId)}
            className="pointer-events-none left-2 right-2 z-[3] animate-drag-pulse opacity-90"
            style={{
              top: `${clip.topPercent}%`,
              height: `${clip.heightPercent}%`,
            }}
          >
            <span className="absolute left-1 top-0.5 font-display text-xs font-bold text-[var(--crayon-stroke)]">
              {formatTime24(minutesToDate(day, localPreview.startMin))}
              {" – "}
              {formatTime24(
                minutesToDate(day, Math.min(localPreview.endMin, 24 * 60 - 1)),
              )}
            </span>
          </CrayonBlock>
        );
      })()}

      {filter !== "overlaps" &&
        soloRects.map((rect) => {
          const clip = clipIntervalToViewport(rect.startMin, rect.endMin, viewport);
          if (!clip) return null;
          const { block } = rect;
          const { topPercent, heightPercent, startMin, endMin } = clip;
          const isYours = block.userId === currentUserId;
          const dimmed = blockDimmed(
            block.userId,
            filter,
            focusedUserId,
            currentUserId,
          );
          const color = colorForUser(block.userId);
          const rangeStart = minutesToDate(day, startMin);
          const rangeEnd = minutesToDate(day, endMin);
          const tier = blockVisualTier(heightPercent);
          const label = `${block.user.name ?? "User"} · ${formatTime24(rangeStart)}–${formatTime24(rangeEnd)}`;
          const status = block.status ?? "free";
          const statusPaper =
            status === "busy"
              ? "paper-block--busy"
              : status === "tentative"
                ? "paper-block--tentative"
                : "";

          const crayon = (
            <CrayonBlock
              data-block-id={block.id}
              color={color}
              variant="fill"
              role={isYours ? "button" : undefined}
              tabIndex={isYours ? 0 : undefined}
              onClick={isYours ? (e) => onSoloClick(rect, e) : undefined}
              onContextMenu={
                isYours ? (e) => e.stopPropagation() : undefined
              }
              className={cn(
                "left-2 right-2 z-[1] transition-opacity duration-fast",
                statusPaper,
                isYours
                  ? "pointer-events-auto cursor-pointer hover:brightness-110"
                  : "pointer-events-none",
                dimmed && "opacity-[0.22]",
                highlightBlockId === block.id && "animate-proposal-flash",
              )}
              style={blockStyle(topPercent, heightPercent)}
              title={label}
            >
              {tier !== "micro" && (
                <div
                  className={cn(
                    "flex h-full items-center gap-1 px-1.5",
                    tier === "full" && "flex-col justify-center py-1",
                  )}
                >
                  <UserAvatar
                    name={block.user.name}
                    image={block.user.image}
                    size="xs"
                  />
                  <span className="truncate font-display text-[10px] font-bold leading-tight text-[var(--crayon-stroke)] sm:text-xs">
                    {block.user.name?.split(" ")[0] ?? "User"}
                    {tier === "full" && (
                      <span className="block tabular-nums font-sans text-[10px] font-normal opacity-90">
                        {formatTime24(rangeStart)}–{formatTime24(rangeEnd)}
                      </span>
                    )}
                  </span>
                </div>
              )}
            </CrayonBlock>
          );

          if (isYours && onSoloEdit && onSoloRemove) {
            return (
              <ContextMenu key={`solo-${block.id}-${startMin}-${dayKey}`}>
                <ContextMenuTrigger asChild>{crayon}</ContextMenuTrigger>
                <ContextMenuContent>
                  <ContextMenuItem onSelect={() => onSoloEdit(block)}>
                    Edit slot
                  </ContextMenuItem>
                  <ContextMenuItem
                    variant="destructive"
                    onSelect={() => onSoloRemove(block.id)}
                  >
                    Remove slot
                  </ContextMenuItem>
                </ContextMenuContent>
              </ContextMenu>
            );
          }

          return (
            <div key={`solo-${block.id}-${startMin}-${dayKey}`} className="contents">
              {crayon}
            </div>
          );
        })}

      {filter !== "mine" &&
        overlapBands.map((band) => {
          const clip = clipIntervalToViewport(band.startMin, band.endMin, viewport);
          if (!clip) return null;
          const { userIds } = band;
          if (
            focusedUserId &&
            !userIds.includes(focusedUserId)
          ) {
            return null;
          }
          const { topPercent, heightPercent, startMin, endMin } = clip;
          const rangeStart = minutesToDate(day, startMin);
          const rangeEnd = minutesToDate(day, endMin);
          const names = userIds
            .map((id) => {
              const b = band.blocks.find((bl) => bl.userId === id);
              return b?.user.name?.split(" ")[0] ?? "User";
            })
            .slice(0, MAX_CALENDAR_OVERLAP);
          const tier = blockVisualTier(heightPercent);
          const label = `${names.join(", ")} · ${formatTime24(rangeStart)}–${formatTime24(rangeEnd)}`;

          return (
            <CrayonBlock
              key={`overlap-${userIds.join("-")}-${startMin}-${dayKey}`}
              color="var(--overlap)"
              variant="overlap"
              role="button"
              tabIndex={0}
              onClick={(e) => onOverlapClick(band, day, e)}
              className={cn(
                "pointer-events-auto left-2 right-2 z-[2] cursor-pointer transition-opacity hover:brightness-105",
                filter === "overlaps" && "ring-2 ring-[var(--overlap-foreground)]/30",
              )}
              style={blockStyle(topPercent, heightPercent)}
              title={label}
            >
              {tier === "micro" ? (
                <div className="flex h-full items-center justify-center">
                  <span className="rounded-md bg-overlap/40 px-1.5 py-px font-display text-[10px] font-bold">
                    {userIds.length}
                  </span>
                </div>
              ) : (
                <div className="flex h-full flex-col justify-center gap-0.5 px-2 py-1">
                  <div className="flex items-center gap-1">
                    <div className="flex -space-x-1">
                      {userIds.slice(0, 3).map((id) => {
                        const b = band.blocks.find((bl) => bl.userId === id);
                        return (
                          <UserAvatar
                            key={id}
                            name={b?.user.name}
                            image={b?.user.image}
                            size="xs"
                            className="ring-1 ring-overlap-foreground/25"
                          />
                        );
                      })}
                    </div>
                    <StatusBadge variant="overlap" className="px-1 py-0 text-[9px]">
                      {userIds.length} free
                    </StatusBadge>
                  </div>
                  {tier === "full" && (
                    <span className="truncate font-display text-[10px] font-bold">
                      {names.join(", ")}
                    </span>
                  )}
                </div>
              )}
            </CrayonBlock>
          );
        })}

      {overlapCount > 0 && filter === "all" && !focusedUserId && (
        <div
          className="pointer-events-none absolute bottom-1 left-1/2 z-[5] -translate-x-1/2"
          aria-hidden
        >
          <span className="rounded-full bg-[var(--overlap)]/90 px-1.5 py-0.5 font-display text-[9px] font-bold text-[var(--overlap-foreground)] shadow-sm">
            {overlapCount} overlap
          </span>
        </div>
      )}

      <WeatherHourLayer
        dayKey={dayKey}
        viewport={viewport}
        hours={hourWeather}
      />
    </div>
  );
}

export const CalendarDayColumn = memo(CalendarDayColumnInner);
