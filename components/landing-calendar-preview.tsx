"use client";

import { motion } from "motion/react";
import { StatusBadge } from "@/components/status-badge";
import { UserAvatar } from "@/components/user-avatar";
import { useReducedMotion } from "@/lib/use-reduced-motion";

export function LandingCalendarPreview() {
  const reduced = useReducedMotion();

  const card = (
    <div
      className="paper-sheet tape-both tape-tl tape-tr relative overflow-hidden p-5"
      style={{ "--paper-tilt": "1.2deg" } as React.CSSProperties}
    >
      <div className="mb-3 flex items-center justify-between">
        <span className="font-display text-2xl font-bold">Week on the wall</span>
        <StatusBadge variant="overlap">3 available</StatusBadge>
      </div>
      <div className="ruled-paper grid grid-cols-[40px_1fr] gap-2 rounded-sm border-2 border-dashed border-[var(--ink-pencil)]/50 p-2">
        <div className="space-y-6 pt-1 font-sans text-xs text-[var(--ink-pencil)]">
          <span>18:00</span>
          <span>20:00</span>
        </div>
        <div className="relative h-32">
          <div
            className="crayon-overlap-scribble crayon-texture absolute inset-x-1 top-5 bottom-8 rounded-sm"
            aria-hidden
          />
          <div className="absolute inset-x-1 top-5 bottom-8 flex items-start gap-2 p-2">
            <div className="flex -space-x-2">
              <UserAvatar name="Alex" size="xs" />
              <UserAvatar name="Sam" size="xs" />
              <UserAvatar name="Jo" size="xs" />
            </div>
            <span className="font-display text-sm font-bold">3 free</span>
          </div>
          <div
            className="crayon-texture absolute inset-x-2 top-2 h-4 rounded-sm border-[3px] border-[var(--crayon-stroke)]"
            style={{ backgroundColor: "oklch(0.62 0.22 25 / 0.55)" }}
            title="Your crayon slot"
          />
        </div>
      </div>
    </div>
  );

  if (reduced) return card;

  return (
    <motion.div
      animate={{ y: [0, -8, 0], rotate: [1.2, 0.8, 1.2] }}
      transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
    >
      {card}
    </motion.div>
  );
}
