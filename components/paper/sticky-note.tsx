"use client";

import type { CSSProperties, ReactNode } from "react";
import { tiltFromId } from "@/lib/paper-tilt";
import { cn } from "@/lib/utils";

type StickyNoteProps = {
  children: ReactNode;
  className?: string;
  tiltId: string;
  backgroundColor: string;
  inkColor?: string;
  interactive?: boolean;
  onClick?: () => void;
};

export function StickyNote({
  children,
  className,
  tiltId,
  backgroundColor,
  inkColor = "oklch(0.28 0.04 50)",
  interactive,
  onClick,
}: StickyNoteProps) {
  const tilt = tiltFromId(tiltId, 4);
  const Comp = onClick ? "button" : "div";

  return (
    <Comp
      type={onClick ? "button" : undefined}
      onClick={onClick}
      className={cn(
        "sticky-note group relative block w-full min-h-[160px] p-4 pt-6 text-left",
        interactive && "sticky-note-hover cursor-pointer",
        className,
      )}
      style={
        {
          "--paper-tilt": `${tilt}deg`,
          "--sticky-bg": backgroundColor,
          "--sticky-ink": inkColor,
        } as CSSProperties
      }
    >
      <span className="sticky-pin" aria-hidden />
      {children}
      <span className="sticky-fold" aria-hidden />
    </Comp>
  );
}
