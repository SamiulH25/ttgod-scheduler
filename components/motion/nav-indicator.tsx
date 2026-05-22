"use client";

import { motion } from "motion/react";
import { useReducedMotion } from "@/lib/use-reduced-motion";
import { cn } from "@/lib/utils";

type NavIndicatorProps = {
  layoutId?: string;
  className?: string;
};

/** Crayon highlighter wash — not the primary red dashed box */
export function NavIndicator({
  layoutId = "nav-active",
  className,
}: NavIndicatorProps) {
  const reduced = useReducedMotion();

  const styles = cn(
    "pointer-events-none absolute inset-y-1 left-1.5 right-1.5 rounded-[2px]",
    "border-2 border-[var(--crayon-stroke)] bg-[var(--overlap)]/25",
    "shadow-[inset_4px_0_0_0_var(--secondary)]",
    className,
  );

  if (reduced) {
    return <span className={styles} aria-hidden />;
  }

  return (
    <motion.span
      layoutId={layoutId}
      className={styles}
      transition={{ type: "spring", stiffness: 380, damping: 32 }}
      aria-hidden
    />
  );
}
