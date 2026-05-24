"use client";

import { cn } from "@/lib/utils";

type PaperSheetProps = {
  children: React.ReactNode;
  className?: string;
  /** @deprecated Tilt disabled */
  tiltId?: string;
  /** @deprecated Tilt disabled */
  tiltDeg?: number;
  tape?: boolean;
  interactive?: boolean;
  as?: "div" | "article";
};

export function PaperSheet({
  children,
  className,
  tape = false,
  interactive = false,
  as: Tag = "div",
}: PaperSheetProps) {
  return (
    <Tag
      className={cn(
        "paper-sheet relative",
        tape && "tape-both tape-tl tape-tr",
        interactive && "paper-sheet-interactive",
        className,
      )}
    >
      {children}
    </Tag>
  );
}
