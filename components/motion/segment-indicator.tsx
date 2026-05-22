"use client";

import { motion } from "motion/react";
import { useReducedMotion } from "@/lib/use-reduced-motion";
import { cn } from "@/lib/utils";

type SegmentIndicatorProps = {
  layoutId?: string;
  className?: string;
};

export function SegmentIndicator({
  layoutId = "segment-active",
  className,
}: SegmentIndicatorProps) {
  const reduced = useReducedMotion();

  const styles = cn(
    "absolute inset-0 rounded-[3px] border-2 border-[var(--crayon-stroke)] bg-[var(--overlap)]/35",
    className,
  );

  if (reduced) {
    return <span className={styles} aria-hidden />;
  }

  return (
    <motion.span
      layoutId={layoutId}
      className={styles}
      transition={{ type: "spring", stiffness: 400, damping: 34 }}
      aria-hidden
    />
  );
}
