"use client";

import { PageTransition } from "@/components/motion/page-transition";
import { MobileTopBar } from "@/components/layout/mobile-top-bar";
import { SideRail } from "@/components/layout/side-rail";
import { CommandPalette } from "@/components/command-palette";

type AppShellProps = {
  children: React.ReactNode;
  userName?: string | null;
  userImage?: string | null;
  pendingInvites?: number;
};

export function AppShell({
  children,
  userName,
  userImage,
  pendingInvites = 0,
}: AppShellProps) {
  return (
    <div className="relative min-h-screen bg-plaster-wall">
      <SideRail
        userName={userName}
        userImage={userImage}
        pendingInvites={pendingInvites}
      />
      <MobileTopBar
        userName={userName}
        userImage={userImage}
        pendingInvites={pendingInvites}
      />

      <CommandPalette />

      <div className="flex min-h-screen flex-col lg:pl-[13rem]">
        <main className="flex min-h-0 flex-1 flex-col">
          <PageTransition>{children}</PageTransition>
        </main>
      </div>
    </div>
  );
}
