"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Calendar,
  LayoutDashboard,
  Settings,
  Users,
  CalendarDays,
} from "lucide-react";
import { LogoMark } from "@/components/logo-mark";
import { GuildSwitcher } from "@/components/guild-switcher";
import { NavIcon } from "@/components/motion/nav-icon";
import { NavIndicator } from "@/components/motion/nav-indicator";
import { PopInPulse } from "@/components/motion/pop-in";
import { Pressable } from "@/components/motion/pressable";
import { UserAvatar } from "@/components/user-avatar";
import { tiltFromId } from "@/lib/paper-tilt";
import { cn } from "@/lib/utils";

const links = [
  { href: "/dashboard", label: "Hub", icon: LayoutDashboard },
  { href: "/availability", label: "Calendar", icon: Calendar },
  { href: "/events", label: "Campaigns", icon: CalendarDays, badgeKey: "events" as const },
  { href: "/squad", label: "Team", icon: Users },
  { href: "/settings", label: "Settings", icon: Settings },
];

type SideRailProps = {
  userName?: string | null;
  userImage?: string | null;
  pendingInvites?: number;
};

export function SideRail({
  userName,
  userImage,
  pendingInvites = 0,
}: SideRailProps) {
  const pathname = usePathname();

  return (
    <aside
      className="fixed inset-y-0 left-0 z-[var(--z-rail)] hidden w-[13rem] flex-col border-r-2 border-dashed border-[var(--ink-pencil)]/40 bg-[var(--wall-plaster)] lg:flex"
      aria-label="Main navigation"
    >
      <div className="flex h-16 items-center border-b border-dashed border-border px-4 text-foreground">
        <Pressable hoverWiggle className="inline-block">
          <Link href="/dashboard" className="block transition-opacity hover:opacity-90">
            <LogoMark />
          </Link>
        </Pressable>
      </div>

      <nav className="flex flex-1 flex-col gap-2 p-3">
        {links.map((link) => {
          const active = pathname === link.href;
          const Icon = link.icon;
          const showBadge =
            link.badgeKey === "events" && pendingInvites > 0;

          return (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "paper-sheet relative flex items-center gap-3 px-3 py-2.5 font-display text-lg font-bold transition-all duration-fast",
                active
                  ? "text-[var(--paper-ink)]"
                  : "text-[var(--paper-ink-muted)] hover:text-[var(--paper-ink)]",
              )}
              style={
                {
                  "--paper-tilt": `${tiltFromId(link.href, 1.5)}deg`,
                } as React.CSSProperties
              }
            >
              {active && <NavIndicator />}
              <NavIcon active={active}>
                <Icon
                  className={cn(
                    "h-5 w-5 stroke-[2.25px]",
                    active
                      ? "text-[var(--paper-ink)]"
                      : "text-[var(--paper-ink-muted)]",
                  )}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </NavIcon>
              <span className="relative z-10 truncate">{link.label}</span>
              {showBadge && (
                <PopInPulse className="relative z-10 ml-auto">
                  <span
                    className="font-display text-sm font-bold text-secondary"
                    aria-label={`${pendingInvites} pending`}
                  >
                    {pendingInvites}
                  </span>
                </PopInPulse>
              )}
            </Link>
          );
        })}
      </nav>

      <GuildSwitcher />

      <Link
        href="/settings"
        className="paper-sheet m-3 flex items-center gap-2 p-3 transition-opacity hover:opacity-90"
        style={{ "--paper-tilt": "-1deg" } as React.CSSProperties}
      >
        <UserAvatar name={userName} image={userImage} size="sm" />
        <span className="truncate font-display text-lg font-bold">
          {userName ?? "Member"}
        </span>
      </Link>
    </aside>
  );
}
