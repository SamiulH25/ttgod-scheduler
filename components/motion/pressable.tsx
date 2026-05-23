"use client";

import { motion, useAnimation } from "motion/react";
import { useEffect, type ReactNode } from "react";
import { springSnappy } from "@/lib/motion-presets";
import { useReducedMotion } from "@/lib/use-reduced-motion";
import { cn } from "@/lib/utils";

type PressableProps = {
  children: ReactNode;
  className?: string;
  /** Bump rotation on hover (nav icons, cards) */
  hoverWiggle?: boolean;
  /** Trigger a success wiggle when this value changes */
  successKey?: string | number | boolean;
  as?: "div" | "span";
};

export function Pressable({
  children,
  className,
  hoverWiggle = false,
  successKey,
  as = "div",
}: PressableProps) {
  const reduced = useReducedMotion();
  const controls = useAnimation();
  const Comp = motion[as];

  useEffect(() => {
    if (reduced || successKey === undefined) return;
    void controls.start({
      rotate: [0, -4, 4, -2, 0],
      scale: [1, 1.04, 1],
      transition: { duration: 0.45 },
    });
  }, [successKey, controls, reduced]);

  if (reduced) {
    const Tag = as;
    return <Tag className={className}>{children}</Tag>;
  }

  return (
    <Comp
      className={cn(className)}
      animate={controls}
      whileHover={
        hoverWiggle
          ? { scale: 1.03, rotate: 2, transition: springSnappy }
          : { scale: 1.02, y: -1, transition: springSnappy }
      }
      whileTap={{ scale: 0.96, transition: springSnappy }}
    >
      {children}
    </Comp>
  );
}
