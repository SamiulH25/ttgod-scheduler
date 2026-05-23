"use client";

import { motion } from "motion/react";
import { NavIndicator } from "@/components/motion/nav-indicator";
import { useReducedMotion } from "@/lib/use-reduced-motion";
import { FONT_OPTIONS, fontFamilyFor, type AppFont } from "@/lib/fonts";
import { cn } from "@/lib/utils";

type FontPickerProps = {
  value: AppFont;
  onChange: (font: AppFont) => void;
};

export function FontPicker({ value, onChange }: FontPickerProps) {
  const reduced = useReducedMotion();
  const Card = reduced ? "button" : motion.button;

  return (
    <div className="space-y-3">
      <h3 className="prose-label">Handwriting font</h3>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {FONT_OPTIONS.map((f) => {
          const selected = value === f.id;
          return (
            <Card
              key={f.id}
              type="button"
              onClick={() => onChange(f.id)}
              {...(!reduced
                ? {
                    whileHover: { scale: 1.03, rotate: 1 },
                    whileTap: { scale: 0.97 },
                  }
                : {})}
              className="paper-sheet relative p-3 text-left"
              style={{ "--paper-tilt": "-0.5deg" } as React.CSSProperties}
            >
              {selected && <NavIndicator layoutId="settings-font" />}
              <p
                className={cn(
                  "relative z-10 text-2xl font-bold text-[var(--paper-ink)]",
                  f.previewClass,
                )}
              >
                Ag
              </p>
              <p className="relative z-10 mt-1 font-display text-lg font-bold text-[var(--paper-ink)]">
                {f.label}
              </p>
              <p className="relative z-10 text-sm text-[var(--paper-ink-muted)]">
                {f.description}
              </p>
            </Card>
          );
        })}
      </div>
      <p
        className="rounded-sm border-2 border-dashed border-[var(--ink-pencil)] bg-[var(--paper-cream)]/50 px-3 py-2 text-lg font-semibold text-[var(--paper-ink)]"
        style={{ fontFamily: fontFamilyFor(value) }}
      >
        The squad meets Thursday at 8pm — preview your font here.
      </p>
    </div>
  );
}
