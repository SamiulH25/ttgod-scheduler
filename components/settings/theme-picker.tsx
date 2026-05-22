"use client";

import { NavIndicator } from "@/components/motion/nav-indicator";
import { THEME_OPTIONS, type AppTheme } from "@/lib/themes";
import { cn } from "@/lib/utils";

type ThemePickerProps = {
  value: AppTheme;
  onChange: (theme: AppTheme) => void;
};

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
      {selected && <NavIndicator layoutId="settings-theme" />}
      <div className="relative z-10 flex gap-1.5">
        {swatches.map((color, i) => (
          <span
            key={i}
            className="h-6 w-6 shrink-0 rounded-sm border-2 border-[var(--crayon-stroke)]"
            style={{ backgroundColor: color }}
          />
        ))}
      </div>
      <p className="relative z-10 mt-2 font-display text-lg font-bold text-[var(--paper-ink)]">
        {label}
      </p>
      <p className="relative z-10 text-sm text-[var(--paper-ink-muted)]">
        {description}
      </p>
    </button>
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
