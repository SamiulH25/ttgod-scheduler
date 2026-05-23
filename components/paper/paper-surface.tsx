"use client";

import { tiltFromId } from "@/lib/paper-tilt";
import { cn } from "@/lib/utils";

export type PaperVariant = "calendarPad" | "tearOff" | "sheet" | "sticky" | "flat";
export type PaperAttachment = "none" | "tapeCorner" | "pushpin";
export type TapeCorner = "tl" | "tr" | "br" | "bl";

type PaperSurfaceProps = {
  children: React.ReactNode;
  className?: string;
  variant?: PaperVariant;
  attachment?: PaperAttachment;
  tapeCorner?: TapeCorner;
  tiltId?: string;
  tiltDeg?: number;
  interactive?: boolean;
  as?: "div" | "section" | "article";
};

const VARIANT_CLASS: Record<PaperVariant, string> = {
  calendarPad: "calendar-pad",
  tearOff: "tear-off-sheet",
  sheet: "paper-sheet",
  sticky: "sticky-note",
  flat: "paper-flat",
};

const TAPE_CLASS: Record<TapeCorner, string> = {
  tl: "tape-tl",
  tr: "tape-tr",
  br: "tape-br",
  bl: "tape-bl",
};

export function PaperSurface({
  children,
  className,
  variant = "sheet",
  attachment = "none",
  tapeCorner = "br",
  tiltId,
  tiltDeg,
  interactive,
  as: Tag = "div",
}: PaperSurfaceProps) {
  const tilt =
    variant === "flat" || variant === "calendarPad"
      ? 0
      : (tiltDeg ?? (tiltId ? tiltFromId(tiltId, variant === "tearOff" ? 1.2 : 2) : 0));

  const tapeClass =
    attachment === "tapeCorner" && variant !== "flat" && variant !== "calendarPad"
      ? TAPE_CLASS[tapeCorner]
      : "";

  return (
    <Tag
      className={cn(
        "relative",
        VARIANT_CLASS[variant],
        tapeClass,
        interactive && variant === "sheet" && "paper-sheet-interactive cursor-default",
        interactive && variant === "sticky" && "sticky-note-hover",
        className,
      )}
      style={
        variant !== "flat" && variant !== "calendarPad"
          ? ({ "--paper-tilt": `${tilt}deg` } as React.CSSProperties)
          : undefined
      }
    >
      {attachment === "pushpin" && variant === "sticky" && (
        <span className="sticky-pin" aria-hidden />
      )}
      {children}
      {variant === "sticky" && <span className="sticky-fold" aria-hidden />}
    </Tag>
  );
}
