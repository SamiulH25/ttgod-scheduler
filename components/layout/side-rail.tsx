"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight } from "lucide-react";
import { LogoMark } from "@/components/logo-mark";
import { GuildSwitcher } from "@/components/guild-switcher";
import { navSections, settingsNavLink } from "@/components/layout/nav-config";
import { NavLinkItem } from "@/components/layout/nav-link-item";
import { UserAvatar } from "@/components/user-avatar";
import { cn } from "@/lib/utils";

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
  const settingsActive = pathname === settingsNavLink.href;

  return (
    <aside
      className="fixed inset-y-0 left-0 z-[var(--z-rail)] hidden w-[15.5rem] flex-col lg:flex"
      aria-label="Main navigation"
    >
      <div className="nav-rail-panel on-paper flex h-full flex-col border-r-2 border-[var(--crayon-stroke)] bg-[var(--paper-cream)] text-[var(--paper-ink)] shadow-[4px_0_24px_oklch(0.2_0.02_50_/_0.12)]">
        <div className="relative border-b-2 border-[var(--crayon-stroke)]/25 px-4 pb-4 pt-5">
          <span
            className="pointer-events-none absolute -right-1 top-3 h-10 w-5 bg-[var(--tape-beige)] shadow-sm"
            aria-hidden
          />
          <Link
            href="/dashboard"
            className="relative block text-[var(--paper-ink)] transition-opacity hover:opacity-90"
          >
            <LogoMark className="text-[var(--paper-ink)]" />
          </Link>
          <p className="relative mt-1 font-sans text-[11px] leading-snug text-[var(--nav-section-label,var(--paper-ink-muted))]">
            Squad calendar & campaigns
          </p>
        </div>

        <nav className="flex flex-1 flex-col gap-5 overflow-y-auto px-3 py-4">
          {navSections.map((section) => (
            <div key={section.title}>
              <p className="mb-2 px-1 font-display text-[10px] font-bold uppercase tracking-[0.14em] text-[var(--nav-section-label,var(--paper-ink-muted))]">
                {section.title}
              </p>
              <ul className="space-y-1.5">
                {section.links.map((link) => (
                  <li key={link.href}>
                    <NavLinkItem
                      link={link}
                      active={pathname === link.href}
                      pendingInvites={pendingInvites}
                    />
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>

        <div className="mt-auto space-y-0 border-t-2 border-[var(--crayon-stroke)]/15">
          <GuildSwitcher variant="rail" />

          <Link
            href={settingsNavLink.href}
            className={cn(
              "nav-rail-item mx-3 mb-3 mt-2 flex items-center gap-3 p-3 transition-[box-shadow,border-color] duration-fast",
              settingsActive && "nav-rail-item-active border-[var(--crayon-stroke)]",
            )}
          >
            <UserAvatar name={userName} image={userImage} size="sm" />
            <span className="min-w-0 flex-1">
              <span className="block truncate font-display text-base font-bold text-[var(--paper-ink)]">
                {userName ?? "Member"}
              </span>
              <span className="block truncate font-sans text-[11px] text-[var(--nav-label-muted)]">
                Settings & profile
              </span>
            </span>
            <ChevronRight
              className="size-4 shrink-0 text-[var(--paper-ink-muted)]"
              aria-hidden
            />
          </Link>
        </div>
      </div>
    </aside>
  );
}
