"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  Calendar,
  CalendarDays,
  LayoutDashboard,
  Menu,
  Settings,
  Users,
  X,
} from "lucide-react";
import { LogoMark } from "@/components/logo-mark";
import { NavIndicator } from "@/components/motion/nav-indicator";
import { UserAvatar } from "@/components/user-avatar";
import { tiltFromId } from "@/lib/paper-tilt";
import { cn } from "@/lib/utils";

const links = [
  { href: "/dashboard", label: "Hub", icon: LayoutDashboard },
  { href: "/availability", label: "Calendar", icon: Calendar },
  { href: "/events", label: "Events", icon: CalendarDays, badgeKey: "events" as const },
  { href: "/squad", label: "Team", icon: Users },
  { href: "/settings", label: "Settings", icon: Settings },
];

type MobileTopBarProps = {
  userName?: string | null;
  userImage?: string | null;
  pendingInvites?: number;
};

export function MobileTopBar({
  userName,
  userImage,
  pendingInvites = 0,
}: MobileTopBarProps) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <>
      <header
        className="paper-sheet tape-both tape-tl tape-tr sticky top-0 z-[var(--z-sticky)] flex h-14 items-center justify-between px-4 lg:hidden"
        style={{ "--paper-tilt": "0deg" } as React.CSSProperties}
      >
        <Link href="/dashboard" onClick={() => setOpen(false)}>
          <LogoMark />
        </Link>
        <div className="flex items-center gap-2">
          {pendingInvites > 0 && (
            <span className="font-display text-sm font-bold text-primary" aria-hidden>
              {pendingInvites}
            </span>
          )}
          <Link href="/settings">
            <UserAvatar name={userName} image={userImage} size="sm" />
          </Link>
          <button
            type="button"
            className="flex h-10 w-10 items-center justify-center border-[3px] border-[var(--crayon-stroke)] bg-[var(--paper-cream)]"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            aria-label={open ? "Close menu" : "Open menu"}
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </header>

      {open && (
        <>
          <div
            className="fixed inset-0 z-[calc(var(--z-sticky)-1)] bg-[var(--wall-plaster)]/70 lg:hidden"
            onClick={() => setOpen(false)}
            aria-hidden
          />
          <nav
            className="fixed left-3 right-3 top-16 z-[var(--z-sticky)] space-y-2 p-2 lg:hidden animate-fade-in"
            aria-label="Mobile navigation"
          >
            {links.map((link) => {
              const active = pathname === link.href;
              const Icon = link.icon;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setOpen(false)}
                  className={cn(
                    "paper-sheet relative flex items-center gap-3 px-4 py-3 font-display text-xl font-bold",
                    active
                      ? "text-[var(--paper-ink)]"
                      : "text-[var(--paper-ink-muted)]",
                  )}
                  style={
                    {
                      "--paper-tilt": `${tiltFromId(link.href, 2)}deg`,
                    } as React.CSSProperties
                  }
                >
                  {active && <NavIndicator />}
                  <Icon
                    className={cn(
                      "relative z-10 h-5 w-5 stroke-[2.25px]",
                      active
                        ? "text-[var(--paper-ink)]"
                        : "text-[var(--paper-ink-muted)]",
                    )}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <span className="relative z-10">{link.label}</span>
                </Link>
              );
            })}
          </nav>
        </>
      )}
    </>
  );
}
