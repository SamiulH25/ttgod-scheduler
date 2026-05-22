"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogoMark } from "@/components/logo-mark";
import { UserAvatar } from "@/components/user-avatar";
import { cn } from "@/lib/utils";

const links = [
  { href: "/dashboard", label: "Hub" },
  { href: "/availability", label: "Calendar" },
  { href: "/events", label: "Events", badgeKey: "events" as const },
  { href: "/squad", label: "Squad" },
  { href: "/settings", label: "Settings" },
];

type AppNavProps = {
  appName: string;
  userName?: string | null;
  userImage?: string | null;
  pendingInvites?: number;
};

export function AppNav({
  appName,
  userName,
  userImage,
  pendingInvites = 0,
}: AppNavProps) {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur-sm">
      <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
        <Link href="/dashboard" className="shrink-0">
          <LogoMark />
          <span className="sr-only">{appName}</span>
        </Link>

        <nav className="-mb-px flex flex-wrap gap-6">
          {links.map((link) => {
            const active = pathname === link.href;
            const showBadge =
              link.badgeKey === "events" && pendingInvites > 0;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "relative border-b-2 pb-2 text-sm font-medium transition-colors",
                  active
                    ? "nav-link-active"
                    : "border-transparent text-muted-foreground hover:text-foreground",
                )}
              >
                {link.label}
                {showBadge && (
                  <span
                    className="absolute -right-2 top-0 h-2 w-2 rounded-full bg-primary"
                    aria-label={`${pendingInvites} pending invites`}
                  />
                )}
              </Link>
            );
          })}
        </nav>

        <Link
          href="/settings"
          className="flex items-center gap-2 transition-opacity hover:opacity-80"
        >
          <UserAvatar name={userName} image={userImage} size="sm" />
          <span className="hidden max-w-[120px] truncate text-sm font-medium sm:inline">
            {userName ?? "Member"}
          </span>
        </Link>
      </div>
    </header>
  );
}
