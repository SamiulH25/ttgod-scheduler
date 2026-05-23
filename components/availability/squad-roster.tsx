"use client";

import { Users, User, Sparkles } from "lucide-react";
import { UserAvatar } from "@/components/user-avatar";
import { cn } from "@/lib/utils";
import { colorForUser } from "@/lib/calendar";
import type { AvailabilityViewFilter, SquadMemberRow } from "@/lib/availability-stats";

type SquadRosterProps = {
  members: SquadMemberRow[];
  totalBlocks: number;
  overlapCount: number;
  myBlockCount: number;
  currentUserId: string;
  filter: AvailabilityViewFilter;
  onFilterChange: (filter: AvailabilityViewFilter) => void;
  focusedUserId: string | null;
  onFocusUser: (userId: string | null) => void;
  onMemberFocus?: (userId: string) => void;
  collapsed?: boolean;
  onCollapsedChange?: (collapsed: boolean) => void;
};

const FILTER_OPTIONS: {
  id: AvailabilityViewFilter;
  label: string;
  short: string;
  icon: typeof Users;
}[] = [
  { id: "all", label: "Everyone", short: "All", icon: Users },
  { id: "mine", label: "Just my blocks", short: "Me", icon: User },
  { id: "overlaps", label: "Overlap zones only", short: "Overlap", icon: Sparkles },
];

export function SquadRoster({
  members,
  totalBlocks,
  overlapCount,
  myBlockCount,
  currentUserId,
  filter,
  onFilterChange,
  focusedUserId,
  onFocusUser,
  onMemberFocus,
  collapsed = false,
  onCollapsedChange,
}: SquadRosterProps) {
  return (
    <section
      className="paper-calendar-roster availability-roster paper-sheet tape-both tape-tl tape-tr overflow-hidden"
      style={{ "--paper-tilt": "0.35deg" } as React.CSSProperties}
      aria-label="Squad on calendar this week"
    >
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-[var(--crayon-stroke)]/25 px-4 py-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h2 className="font-display text-xl font-bold text-[var(--paper-ink)]">
              On calendar this week
            </h2>
            {onCollapsedChange && (
              <button
                type="button"
                className="text-xs font-semibold text-primary lg:hidden"
                onClick={() => onCollapsedChange(!collapsed)}
              >
                {collapsed ? "Show roster" : "Hide"}
              </button>
            )}
          </div>
          <p className="mt-0.5 text-sm text-[var(--paper-ink-muted)]">
            {totalBlocks === 0
              ? "Nobody has posted availability yet — drag on the grid to add yours."
              : (
                <>
                  <span className="tabular-nums font-semibold text-[var(--paper-ink)]">
                    {totalBlocks}
                  </span>{" "}
                  {totalBlocks === 1 ? "block" : "blocks"}
                  {overlapCount > 0 && (
                    <>
                      {" · "}
                      <span className="tabular-nums font-semibold text-[var(--overlap-foreground)]">
                        {overlapCount}
                      </span>{" "}
                      overlap {overlapCount === 1 ? "zone" : "zones"}
                    </>
                  )}
                  {myBlockCount > 0 && (
                    <>
                      {" · you: "}
                      <span className="tabular-nums font-semibold">{myBlockCount}</span>
                    </>
                  )}
                </>
              )}
          </p>
        </div>

        <div
          className="flex shrink-0 rounded-lg border border-[var(--crayon-stroke)]/40 bg-[var(--paper-cream)]/80 p-0.5"
          role="tablist"
          aria-label="Calendar view filter"
        >
          {FILTER_OPTIONS.map((opt) => {
            const Icon = opt.icon;
            const active = filter === opt.id;
            return (
              <button
                key={opt.id}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => {
                  onFilterChange(opt.id);
                  if (opt.id === "mine") onFocusUser(null);
                }}
                className={cn(
                  "flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-semibold transition-colors",
                  active
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-[var(--paper-ink-muted)] hover:bg-[var(--tape-beige)]/40 hover:text-[var(--paper-ink)]",
                )}
              >
                <Icon className="size-3.5 shrink-0" aria-hidden />
                <span className="hidden sm:inline">{opt.label}</span>
                <span className="sm:hidden">{opt.short}</span>
              </button>
            );
          })}
        </div>
      </div>

      {!collapsed && members.length > 0 && filter !== "overlaps" && (
        <div className="px-3 py-3">
          <p className="mb-2 px-1 text-[10px] font-bold uppercase tracking-wide text-[var(--paper-ink-muted)]">
            Tap a name to spotlight on the grid
          </p>
          <ul className="flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <li>
              <button
                type="button"
                onClick={() => onFocusUser(null)}
                className={cn(
                  "paper-calendar-member-chip availability-member-chip",
                  focusedUserId === null && filter === "all" && "paper-calendar-member-chip--active availability-member-chip--active",
                )}
              >
                <span className="paper-calendar-member-chip__dot availability-member-chip__dot bg-[var(--ink-pencil)]" />
                <span className="font-display font-bold">Everyone</span>
              </button>
            </li>
            {members.map((member) => {
              const isYou = member.userId === currentUserId;
              const focused = focusedUserId === member.userId;
              return (
                <li key={member.userId}>
                  <button
                    type="button"
                    onClick={() => {
                      const next = focused ? null : member.userId;
                      onFocusUser(next);
                      if (next && onMemberFocus) onMemberFocus(next);
                    }}
                    disabled={filter === "mine" && !isYou}
                    className={cn(
                      "paper-calendar-member-chip availability-member-chip",
                      focused && "paper-calendar-member-chip--active availability-member-chip--active",
                      filter === "mine" && !isYou && "opacity-40",
                    )}
                  >
                    <UserAvatar
                      name={member.user.name}
                      image={member.user.image}
                      size="xs"
                    />
                    <span
                      className="paper-calendar-member-chip__dot availability-member-chip__dot shrink-0"
                      style={{ backgroundColor: colorForUser(member.userId) }}
                    />
                    <span className="max-w-[7rem] truncate font-display font-bold">
                      {member.user.name?.split(" ")[0] ?? "Member"}
                      {isYou && (
                        <span className="font-normal text-[var(--paper-ink-muted)]">
                          {" "}
                          (you)
                        </span>
                      )}
                    </span>
                    <span className="tabular-nums text-[10px] font-bold text-[var(--paper-ink-muted)]">
                      {member.blockCount}
                    </span>
                    {member.lfgNote && (
                      <span
                        className="rounded-sm bg-secondary/25 px-1.5 py-0.5 text-[9px] font-bold uppercase text-secondary"
                        title={member.lfgNote}
                      >
                        LFG
                      </span>
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      {filter === "overlaps" && (
        <p className="border-t border-[var(--crayon-stroke)]/20 px-4 py-3 text-sm text-[var(--paper-ink-muted)]">
          Showing shared free-time bands only — when two or more squad members overlap.
          {overlapCount === 0 && " None this week yet."}
        </p>
      )}
    </section>
  );
}
