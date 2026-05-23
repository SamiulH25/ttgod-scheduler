"use client";

import { PaperFlip } from "@/components/motion/paper-flip";
import { cn } from "@/lib/utils";

type PaperCalendarShellProps = {
  children: React.ReactNode;
  className?: string;
  flipKey?: string;
  flipDirection?: "left" | "right";
  enableFlip?: boolean;
};

export function PaperCalendarShell({
  children,
  className,
  flipKey,
  flipDirection = "right",
  enableFlip = false,
}: PaperCalendarShellProps) {
  const shell = (
    <div
      className={cn(
        "paper-calendar-grid-shell min-w-0 flex-1",
        className,
      )}
    >
      {children}
    </div>
  );

  if (enableFlip && flipKey) {
    return (
      <PaperFlip flipKey={flipKey} direction={flipDirection}>
        {shell}
      </PaperFlip>
    );
  }

  return shell;
}
