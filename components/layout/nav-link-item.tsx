"use client";

import Link from "next/link";
import { NavIcon } from "@/components/motion/nav-icon";
import { NavIndicator } from "@/components/motion/nav-indicator";
import { PopInPulse } from "@/components/motion/pop-in";
import type { NavLinkDef } from "@/components/layout/nav-config";
import { cn } from "@/lib/utils";

type NavLinkItemProps = {
  link: NavLinkDef;
  active: boolean;
  pendingInvites?: number;
  onNavigate?: () => void;
  compact?: boolean;
};

export function NavLinkItem({
  link,
  active,
  pendingInvites = 0,
  onNavigate,
  compact,
}: NavLinkItemProps) {
  const Icon = link.icon;
  const showBadge = link.badgeKey === "events" && pendingInvites > 0;

  return (
    <Link
      href={link.href}
      onClick={onNavigate}
      className={cn(
        "nav-rail-item group relative flex items-center gap-3 transition-[box-shadow,background-color,border-color] duration-fast",
        compact ? "px-3 py-2.5" : "px-3 py-3",
        active
          ? "nav-rail-item-active border-[var(--crayon-stroke)]"
          : "hover:border-[var(--ink-pencil)]",
      )}
    >
      {active && <NavIndicator layoutId="nav-active-desktop" />}
      <span
        className={cn(
          "relative z-10 flex h-9 w-9 shrink-0 items-center justify-center rounded-sm border-2 transition-colors",
          active
            ? "border-[var(--crayon-stroke)] bg-primary text-primary-foreground"
            : "border-[var(--nav-item-border)] bg-[var(--nav-icon-bg)] text-[var(--nav-icon-fg)] group-hover:border-[var(--nav-item-border-hover)]",
        )}
      >
        <NavIcon active={active}>
          <Icon
            className="h-[1.125rem] w-[1.125rem] stroke-[2.25px]"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </NavIcon>
      </span>
      <span className="relative z-10 min-w-0 flex-1">
        <span
          className={cn(
            "block truncate font-display font-bold leading-tight",
            compact ? "text-base" : "text-lg",
            active
              ? "text-[var(--nav-label)]"
              : "text-[var(--nav-label-muted)] group-hover:text-[var(--nav-label)]",
          )}
        >
          {link.label}
        </span>
        {link.hint && !compact && (
          <span className="block truncate font-sans text-[11px] leading-snug text-[var(--nav-label-muted)]">
            {link.hint}
          </span>
        )}
      </span>
      {showBadge && (
        <PopInPulse className="relative z-10 ml-auto shrink-0">
          <span
            className="inline-flex min-w-[1.25rem] items-center justify-center rounded-sm border-2 border-[var(--crayon-stroke)] bg-secondary px-1.5 py-0.5 font-display text-xs font-bold text-secondary-foreground"
            aria-label={`${pendingInvites} pending invites`}
          >
            {pendingInvites}
          </span>
        </PopInPulse>
      )}
    </Link>
  );
}
