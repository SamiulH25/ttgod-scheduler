"use client";

import type { CSSProperties, ReactNode } from "react";
import { bulletinTiltFromId, tiltFromId } from "@/lib/paper-tilt";
import type { StickyTapeCorner } from "@/lib/sticky-colors";
import { cn } from "@/lib/utils";

type StickyNoteProps = {
  children: ReactNode;
  className?: string;
  tiltId: string;
  backgroundColor: string;
  inkColor?: string;
  interactive?: boolean;
  onClick?: () => void;
  attachment?: "pushpin" | "tapeCorner";
  tapeCorner?: StickyTapeCorner;
  bulletin?: boolean;
};

const TAPE_CLASS: Record<StickyTapeCorner, string> = {
  tl: "tape-tl",
  tr: "tape-tr",
  br: "tape-br",
  bl: "tape-bl",
};

export function StickyNote({
  children,
  className,
  tiltId,
  backgroundColor,
  inkColor = "oklch(0.28 0.04 50)",
  interactive,
  onClick,
  attachment = "pushpin",
  tapeCorner = "tr",
  bulletin = false,
}: StickyNoteProps) {
  const tilt = bulletin ? bulletinTiltFromId(tiltId) : tiltFromId(tiltId, 4);
  const Comp = onClick ? "button" : "div";
  const usePin = attachment === "pushpin";

  return (
    <Comp
      type={onClick ? "button" : undefined}
      onClick={onClick}
      className={cn(
        "sticky-note group relative block w-full min-h-[160px] p-4 text-left",
        !usePin && TAPE_CLASS[tapeCorner],
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
      {usePin && <span className="sticky-pin" aria-hidden />}
      {children}
      <span className="sticky-fold" aria-hidden />
    </Comp>
  );
}
