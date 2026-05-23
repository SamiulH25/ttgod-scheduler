"use client";

import { motion } from "motion/react";
import { NavIndicator } from "@/components/motion/nav-indicator";
import { THEME_OPTIONS, type AppTheme } from "@/lib/themes";
import { useReducedMotion } from "@/lib/use-reduced-motion";
import { cn } from "@/lib/utils";

type ThemePickerProps = {
  value: AppTheme;
  onChange: (theme: AppTheme) => void;
};

function ThemeSwatch({
  color,
  index,
}: {
  color: string;
  index: number;
}) {
  const reduced = useReducedMotion();
  const className =
    "h-6 w-6 shrink-0 rounded-sm border-2 border-[var(--crayon-stroke)]";

  if (reduced) {
    return (
      <span className={className} style={{ backgroundColor: color }} />
    );
  }

  return (
    <motion.span
      className={className}
      style={{ backgroundColor: color }}
      whileHover={{
        scale: 1.15,
        rotate: index % 2 === 0 ? 8 : -8,
      }}
      transition={{ type: "spring", stiffness: 420, damping: 18 }}
    />
  );
}

function ThemeCard({
  selected,
  label,
  description,
  swatches,
  onClick,
}: {
  selected: boolean;
  label: string;
  description: string;
  swatches: string[];
  onClick: () => void;
}) {
  const reduced = useReducedMotion();
  const inner = (
    <>
      {selected && <NavIndicator layoutId="settings-theme" />}
      <div className="relative z-10 flex gap-1.5">
        {swatches.map((color, i) => (
          <ThemeSwatch key={i} color={color} index={i} />
        ))}
      </div>
      <p className="relative z-10 mt-2 font-display text-lg font-bold text-[var(--paper-ink)]">
        {label}
      </p>
      <p className="relative z-10 text-sm text-[var(--paper-ink-muted)]">
        {description}
      </p>
    </>
  );

  if (reduced) {
    return (
      <button
        type="button"
        onClick={onClick}
        className={cn(
          "paper-sheet relative w-full p-3 text-left transition-all duration-fast",
          selected && "ring-0",
        )}
        style={{ "--paper-tilt": "0.4deg" } as React.CSSProperties}
      >
        {inner}
      </button>
    );
  }

  return (
    <motion.button
      type="button"
      onClick={onClick}
      whileHover={{ scale: 1.02, rotate: -0.5 }}
      whileTap={{ scale: 0.98 }}
      className={cn(
        "paper-sheet relative w-full p-3 text-left",
        selected && "ring-0",
      )}
      style={{ "--paper-tilt": "0.4deg" } as React.CSSProperties}
    >
      {inner}
    </motion.button>
  );
}

export function ThemePicker({ value, onChange }: ThemePickerProps) {
  const classic = THEME_OPTIONS.filter((t) => t.group === "classic");
  const squad = THEME_OPTIONS.filter((t) => t.group === "squad");

  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <h3 className="prose-label">Classic</h3>
        <div className="grid gap-3 sm:grid-cols-3">
          {classic.map((t) => (
            <ThemeCard
              key={t.id}
              selected={value === t.id}
              label={t.label}
              description={t.description}
              swatches={t.swatches}
              onClick={() => onChange(t.id)}
            />
          ))}
        </div>
      </div>
      <div className="space-y-3">
        <h3 className="prose-label">Squad themes</h3>
        <div className="grid gap-3 sm:grid-cols-3">
          {squad.map((t) => (
            <ThemeCard
              key={t.id}
              selected={value === t.id}
              label={t.label}
              description={t.description}
              swatches={t.swatches}
              onClick={() => onChange(t.id)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
