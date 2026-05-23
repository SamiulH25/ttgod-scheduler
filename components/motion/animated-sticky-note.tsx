"use client";

import type { ReactNode } from "react";
import { motion } from "motion/react";
import { StickyNote } from "@/components/paper/sticky-note";
import type { StickyTapeCorner } from "@/lib/sticky-colors";
import { springBouncy } from "@/lib/motion-presets";
import { useReducedMotion } from "@/lib/use-reduced-motion";
import { cn } from "@/lib/utils";

type AnimatedStickyNoteProps = {
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
  /** Pin-drop entrance */
  enter?: boolean;
  /** Highlight pulse after create */
  highlight?: boolean;
  layout?: boolean;
};

export function AnimatedStickyNote({
  children,
  className,
  tiltId,
  backgroundColor,
  inkColor,
  interactive,
  onClick,
  attachment,
  tapeCorner,
  bulletin = true,
  enter = true,
  highlight = false,
  layout = true,
}: AnimatedStickyNoteProps) {
  const reduced = useReducedMotion();

  const note = (
    <StickyNote
      tiltId={tiltId}
      backgroundColor={backgroundColor}
      inkColor={inkColor}
      interactive={interactive}
      onClick={onClick}
      attachment={attachment}
      tapeCorner={tapeCorner}
      bulletin={bulletin}
      className={cn(highlight && "animate-sticky-highlight", className)}
    >
      {children}
    </StickyNote>
  );

  if (reduced) {
    return note;
  }

  return (
    <motion.div
      layout={layout}
      initial={enter ? { opacity: 0, y: -24, scale: 0.92 } : false}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
      transition={springBouncy}
      whileHover={
        interactive
          ? {
              rotate: [0, -1.5, 1.5, 0],
              transition: { duration: 0.35 },
            }
          : undefined
      }
      className="h-full w-full"
    >
      {note}
    </motion.div>
  );
}
