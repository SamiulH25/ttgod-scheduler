"use client";

import { cn } from "@/lib/utils";

type CampaignHeroProps = {
  title: string;
  subtitle?: string;
  phaseLabel: string;
  meta?: React.ReactNode;
  actions?: React.ReactNode;
  description?: string | null;
  className?: string;
};

export function CampaignHero({
  title,
  subtitle,
  phaseLabel,
  meta,
  actions,
  description,
  className,
}: CampaignHeroProps) {
  return (
    <header className={cn("paper-panel on-paper", className)}>
      <div className="paper-panel-body space-y-4">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0 space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center rounded-sm border-2 border-primary bg-primary/12 px-2.5 py-0.5 font-display text-xs font-bold uppercase tracking-wide text-[var(--paper-ink)]">
                {phaseLabel}
              </span>
              {meta}
            </div>
            <div className="space-y-1">
              <h1 className="paper-panel-title text-3xl sm:text-4xl">{title}</h1>
              {subtitle && (
                <p className="text-base font-semibold text-[var(--paper-ink-muted)] sm:text-lg">
                  {subtitle}
                </p>
              )}
            </div>
            {description && (
              <p className="max-w-2xl text-sm leading-relaxed text-[var(--paper-ink-muted)]">
                {description}
              </p>
            )}
            <div className="pencil-rule max-w-md" />
          </div>
          {actions ? (
            <div className="flex shrink-0 flex-wrap gap-2 lg:justify-end">{actions}</div>
          ) : null}
        </div>
      </div>
    </header>
  );
}
