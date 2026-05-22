"use client";

import { tiltFromId } from "@/lib/paper-tilt";
import { cn } from "@/lib/utils";

type PaperSheetProps = {
  children: React.ReactNode;
  className?: string;
  tiltId?: string;
  tiltDeg?: number;
  tape?: boolean;
  interactive?: boolean;
  as?: "div" | "article";
};

export function PaperSheet({
  children,
  className,
  tiltId,
  tiltDeg,
  tape = false,
  interactive = false,
  as: Tag = "div",
}: PaperSheetProps) {
  const tilt = tiltDeg ?? (tiltId ? tiltFromId(tiltId) : 0);

  return (
    <Tag
      className={cn(
        "paper-sheet relative",
        tape && "tape-both tape-tl tape-tr",
        interactive && "paper-sheet-interactive",
        className,
      )}
      style={{ "--paper-tilt": `${tilt}deg` } as React.CSSProperties}
    >
      {children}
    </Tag>
  );
}
