"use client";

import { format } from "date-fns";
import { StatusBadge } from "@/components/status-badge";
import { UserAvatar } from "@/components/user-avatar";
import { SlotFreeUsers } from "@/components/slot-free-users";
import { Button } from "@/components/ui/button";
import {
  buildAgendaItemsForDay,
  type AgendaItem,
} from "@/lib/agenda-items";
import { formatTime24, type CalendarBlock } from "@/lib/calendar";
import { cn } from "@/lib/utils";

type AgendaDayListProps = {
  day: Date;
  blocks: CalendarBlock[];
  currentUserId: string;
  onItemClick?: (item: AgendaItem) => void;
  onPaintSlot?: () => void;
  emptyMessage?: string;
  className?: string;
};

export function AgendaDayList({
  day,
  blocks,
  currentUserId,
  onItemClick,
  onPaintSlot,
  emptyMessage = "Nothing on this day yet.",
  className,
}: AgendaDayListProps) {
  const items = buildAgendaItemsForDay(day, blocks);

  return (
    <div className={cn("space-y-3", className)}>
      <div className="flex items-center justify-between gap-2">
        <h3 className="font-display text-lg font-bold text-[var(--paper-ink)]">
          {format(day, "EEEE, MMM d")}
        </h3>
        {onPaintSlot && (
          <Button type="button" size="sm" variant="outline" onClick={onPaintSlot}>
            Paint slot
          </Button>
        )}
      </div>

      {items.length === 0 ? (
        <p className="text-sm text-muted-foreground">{emptyMessage}</p>
      ) : (
        <ul className="space-y-2" aria-label={`Agenda for ${format(day, "MMMM d")}`}>
          {items.map((item) => {
            const isYours = item.userIds.includes(currentUserId);
            const isOverlap = item.kind === "overlap";

            return (
              <li key={item.id}>
                <button
                  type="button"
                  className={cn(
                    "paper-sheet w-full px-3 py-2 text-left transition-colors hover:bg-muted/40",
                    isYours && item.kind === "solo" && "ring-1 ring-primary/30",
                  )}
                  onClick={() => onItemClick?.(item)}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-display text-sm font-bold tabular-nums">
                        {formatTime24(item.start)} – {formatTime24(item.end)}
                      </p>
                      <p className="mt-0.5 truncate text-xs text-muted-foreground">
                        {item.label}
                      </p>
                      {isOverlap && (
                        <div className="mt-2">
                          <SlotFreeUsers
                            start={item.start}
                            end={item.end}
                            compact
                          />
                        </div>
                      )}
                    </div>
                    {isOverlap ? (
                      <StatusBadge variant="overlap" className="shrink-0 text-[10px]">
                        overlap
                      </StatusBadge>
                    ) : (
                      <UserAvatar
                        name={
                          blocks.find((b) => b.userId === item.userIds[0])?.user
                            .name ?? null
                        }
                        image={
                          blocks.find((b) => b.userId === item.userIds[0])?.user
                            .image ?? null
                        }
                        size="xs"
                        className="shrink-0 ring-2 ring-[var(--crayon-stroke)]/40"
                      />
                    )}
                  </div>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
