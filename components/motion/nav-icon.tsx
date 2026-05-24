"use client";

import { motion } from "motion/react";
import type { ReactNode } from "react";
import { springSnappy } from "@/lib/motion-presets";
import { useReducedMotion } from "@/lib/use-reduced-motion";

export function NavIcon({
  children,
  active,
}: {
  children: ReactNode;
  active?: boolean;
}) {
  const reduced = useReducedMotion();

  if (reduced || active) {
    return <span className="relative z-10 inline-flex shrink-0">{children}</span>;
  }

  return (
    <motion.span
      className="relative z-10 inline-flex shrink-0"
      whileHover={{ scale: 1.08 }}
      transition={springSnappy}
    >
      {children}
    </motion.span>
  );
}
