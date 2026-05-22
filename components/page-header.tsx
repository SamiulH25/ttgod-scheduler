"use client";

import { motion } from "motion/react";
import { useReducedMotion } from "@/lib/use-reduced-motion";
import { cn } from "@/lib/utils";

type PageHeaderProps = {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  className?: string;
};

export function PageHeader({ title, subtitle, action, className }: PageHeaderProps) {
  const reduced = useReducedMotion();

  return (
    <div
      className={cn(
        "relative flex flex-col gap-4 pb-6 sm:flex-row sm:items-end sm:justify-between",
        className,
      )}
    >
      <div className="space-y-2">
        {reduced ? (
          <>
            <h1 className="font-display text-4xl font-bold tracking-tight">{title}</h1>
            {subtitle && (
              <p className="max-w-xl font-sans text-lg font-medium text-muted-foreground">{subtitle}</p>
            )}
          </>
        ) : (
          <>
            <motion.h1
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
              className="font-display text-4xl font-bold tracking-tight"
            >
              {title}
            </motion.h1>
            {subtitle && (
              <motion.p
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, delay: 0.05 }}
                className="max-w-xl font-sans text-lg font-medium text-muted-foreground"
              >
                {subtitle}
              </motion.p>
            )}
          </>
        )}
        <div className="pencil-rule mt-3 max-w-xs" />
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}
