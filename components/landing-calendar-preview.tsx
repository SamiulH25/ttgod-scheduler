"use client";

import { motion } from "motion/react";
import { StatusBadge } from "@/components/status-badge";
import { UserAvatar } from "@/components/user-avatar";
import { useReducedMotion } from "@/lib/use-reduced-motion";

export function LandingCalendarPreview() {
  const reduced = useReducedMotion();

  const card = (
    <div
      className="calendar-pad relative overflow-hidden p-5 pl-6"
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
          <motion.div
            className="crayon-overlap-scribble crayon-texture absolute inset-x-1 top-5 bottom-8 rounded-sm"
            aria-hidden
            animate={{ scale: [1, 1.02, 1] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          />
          <div className="absolute inset-x-1 top-5 bottom-8 flex items-start gap-2 p-2">
            <div className="flex -space-x-2">
              {(["Alex", "Sam", "Jo"] as const).map((name, i) => (
                <motion.div
                  key={name}
                  initial={{ opacity: 0, scale: 0.6 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.2 + i * 0.12, type: "spring", stiffness: 320 }}
                >
                  <UserAvatar name={name} size="xs" />
                </motion.div>
              ))}
            </div>
            <motion.span
              className="font-display text-sm font-bold"
              initial={{ opacity: 0, x: -6 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.55 }}
            >
              3 free
            </motion.span>
          </div>
          <motion.div
            className="crayon-texture absolute inset-x-2 top-2 h-4 rounded-sm border-[3px] border-[var(--crayon-stroke)]"
            style={{ backgroundColor: "oklch(0.62 0.22 25 / 0.55)" }}
            title="Your crayon slot"
            animate={{ y: [0, -3, 0], rotate: [0, 1.5, 0] }}
            transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut", delay: 0.3 }}
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
