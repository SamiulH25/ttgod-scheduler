"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Menu, X } from "lucide-react";
import { LogoMark } from "@/components/logo-mark";
import { navSections, settingsNavLink } from "@/components/layout/nav-config";
import { NavLinkItem } from "@/components/layout/nav-link-item";
import { PopInPulse } from "@/components/motion/pop-in";
import { UserAvatar } from "@/components/user-avatar";

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
            <PopInPulse>
              <span
                className="inline-flex min-w-[1.25rem] items-center justify-center rounded-sm border-2 border-[var(--crayon-stroke)] bg-secondary px-1.5 font-display text-xs font-bold text-secondary-foreground"
                aria-hidden
              >
                {pendingInvites}
              </span>
            </PopInPulse>
          )}
          <Link href="/settings">
            <UserAvatar name={userName} image={userImage} size="sm" />
          </Link>
          <button
            type="button"
            className="flex h-10 w-10 items-center justify-center border-[3px] border-[var(--crayon-stroke)] bg-[var(--paper-cream)] text-[var(--paper-ink)]"
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
            className="fixed inset-0 z-[calc(var(--z-sticky)-1)] bg-[var(--wall-plaster)]/80 backdrop-blur-[2px] lg:hidden"
            onClick={() => setOpen(false)}
            aria-hidden
          />
          <nav
            className="nav-rail-panel on-paper fixed left-3 right-3 top-[3.75rem] z-[var(--z-sticky)] max-h-[calc(100vh-5rem)] overflow-y-auto rounded-sm border-2 border-[var(--crayon-stroke)] bg-[var(--paper-cream)] p-3 text-[var(--paper-ink)] shadow-[var(--paper-shadow)] lg:hidden animate-fade-in"
            aria-label="Mobile navigation"
          >
            {navSections.map((section) => (
              <div key={section.title} className="mb-4 last:mb-2">
                <p className="mb-2 px-1 font-display text-[10px] font-bold uppercase tracking-[0.14em] text-[var(--paper-ink-muted)]">
                  {section.title}
                </p>
                <ul className="space-y-1.5">
                  {section.links.map((link) => (
                    <li key={link.href}>
                      <NavLinkItem
                        link={link}
                        active={pathname === link.href}
                        pendingInvites={pendingInvites}
                        onNavigate={() => setOpen(false)}
                        compact
                      />
                    </li>
                  ))}
                </ul>
              </div>
            ))}
            <p className="mb-2 px-1 font-display text-[10px] font-bold uppercase tracking-[0.14em] text-[var(--paper-ink-muted)]">
              Account
            </p>
            <NavLinkItem
              link={settingsNavLink}
              active={pathname === settingsNavLink.href}
              onNavigate={() => setOpen(false)}
              compact
            />
          </nav>
        </>
      )}
    </>
  );
}
