"use client";

import { motion } from "motion/react";
import { useReducedMotion } from "@/lib/use-reduced-motion";
import { cn } from "@/lib/utils";
import { Calendar, Users } from "lucide-react";

const EMPTY_STATE_ICONS = {
  calendar: Calendar,
  users: Users,
} as const;

export type EmptyStateIconName = keyof typeof EMPTY_STATE_ICONS;

type EmptyStateProps = {
  iconName: EmptyStateIconName;
  title: string;
  description: string;
  action?: React.ReactNode;
  className?: string;
};

export function EmptyState({
  iconName,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  const reduced = useReducedMotion();
  const Icon = EMPTY_STATE_ICONS[iconName];

  const iconEl = (
    <div
      className={cn(
        "mb-4 flex h-14 w-14 items-center justify-center rounded-full border-[3px] border-dashed border-[var(--ink-pencil)] bg-[var(--paper-inset-bg)]",
        !reduced && "animate-float-note",
      )}
    >
      <Icon className="h-6 w-6 text-[var(--paper-ink-muted)]" />
    </div>
  );

  return (
    <div
      className={cn(
        "paper-sheet on-paper tape-both tape-tl tape-tr flex flex-col items-center px-6 py-12 text-center",
        className,
      )}
    >
      {reduced ? iconEl : (
        <motion.div
          initial={{ opacity: 0, scale: 0.85 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.35 }}
        >
          {iconEl}
        </motion.div>
      )}
      <h3 className="font-display text-2xl font-bold">{title}</h3>
      <p className="mt-2 max-w-sm font-display text-lg font-medium text-[var(--paper-ink-muted)]">
        {description}
      </p>
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}
