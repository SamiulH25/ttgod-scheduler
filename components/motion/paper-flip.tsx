"use client";

import { AnimatePresence, motion } from "motion/react";
import { isSnappyNav } from "@/lib/snappy-nav";
import { useReducedMotion } from "@/lib/use-reduced-motion";
import { cn } from "@/lib/utils";

type PaperFlipProps = {
  flipKey: string;
  direction: "left" | "right";
  children: React.ReactNode;
  className?: string;
};

export function PaperFlip({
  flipKey,
  direction,
  children,
  className,
}: PaperFlipProps) {
  const reduced = useReducedMotion();
  const snappy = isSnappyNav();
  const exitRotate = direction === "right" ? -88 : 88;
  const enterRotate = direction === "right" ? 88 : -88;

  if (reduced) {
    return <div className={className}>{children}</div>;
  }

  if (snappy) {
    return (
      <div className={cn("relative", className)}>
        <AnimatePresence mode="sync" initial={false}>
          <motion.div
            key={flipKey}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.12 }}
            className="paper-sheet tape-both tape-tl tape-tr w-full"
          >
            {children}
          </motion.div>
        </AnimatePresence>
      </div>
    );
  }

  return (
    <div className={cn("perspective-wall relative", className)}>
      <AnimatePresence mode="sync" initial={false}>
        <motion.div
          key={flipKey}
          initial={{
            rotateY: enterRotate,
            opacity: 0.4,
            transformOrigin: direction === "right" ? "left center" : "right center",
          }}
          animate={{
            rotateY: 0,
            opacity: 1,
            transformOrigin: "center center",
          }}
          exit={{
            rotateY: exitRotate,
            opacity: 0,
            transformOrigin: direction === "right" ? "right center" : "left center",
          }}
          transition={{ duration: 0.42, ease: [0.22, 0.9, 0.32, 1] }}
          style={{ transformStyle: "preserve-3d", backfaceVisibility: "hidden" }}
          className="paper-sheet tape-both tape-tl tape-tr w-full"
        >
          {children}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
