"use client";

import { motion } from "motion/react";
import type { ReactNode } from "react";
import { stampPopKeyframes } from "@/lib/motion-presets";
import { useReducedMotion } from "@/lib/use-reduced-motion";
import { cn } from "@/lib/utils";

type StampMotionProps = {
  children: ReactNode;
  className?: string;
  /** Increment to replay stamp animation */
  animationKey?: number;
};

export function StampMotion({
  children,
  className,
  animationKey = 0,
}: StampMotionProps) {
  const reduced = useReducedMotion();

  if (reduced) {
    return <span className={cn("inline-flex", className)}>{children}</span>;
  }

  return (
    <motion.span
      key={animationKey}
      className={cn("inline-flex", className)}
      initial={{ scale: 1, rotate: 0 }}
      animate={{ scale: [1, 1.14, 0.97, 1], rotate: [0, -7, 5, 0] }}
      transition={stampPopKeyframes}
    >
      {children}
    </motion.span>
  );
}
