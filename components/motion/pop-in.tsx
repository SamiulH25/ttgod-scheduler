"use client";

import { motion } from "motion/react";
import type { ReactNode } from "react";
import { popIn } from "@/lib/motion-presets";
import { useReducedMotion } from "@/lib/use-reduced-motion";
import { cn } from "@/lib/utils";

type PopInProps = {
  children: ReactNode;
  className?: string;
  delay?: number;
  layout?: boolean;
};

export function PopIn({ children, className, delay = 0, layout }: PopInProps) {
  const reduced = useReducedMotion();

  if (reduced) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      layout={layout}
      initial={{ opacity: 0, scale: 0.85, rotate: -3 }}
      animate={{ opacity: 1, scale: 1, rotate: 0 }}
      transition={{ ...popIn, delay }}
      className={cn(className)}
    >
      {children}
    </motion.div>
  );
}

type PopInPulseProps = {
  children: ReactNode;
  className?: string;
  active?: boolean;
};

/** Subtle repeating pulse (badges, empty-state icons) */
export function PopInPulse({ children, className, active = true }: PopInPulseProps) {
  const reduced = useReducedMotion();

  if (reduced || !active) {
    return <span className={className}>{children}</span>;
  }

  return (
    <motion.span
      className={cn("inline-flex", className)}
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{
        scale: [1, 1.08, 1],
        opacity: 1,
      }}
      transition={{
        scale: { repeat: Infinity, duration: 2.2, ease: "easeInOut" },
        opacity: { duration: 0.3 },
      }}
    >
      {children}
    </motion.span>
  );
}
