"use client";

import { HolidayDayChip } from "@/components/calendar/holiday-day-chip";
import { StatusBadge } from "@/components/status-badge";
import { UserAvatar } from "@/components/user-avatar";
import { FadeIn } from "@/components/motion/fade-in";

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export function LandingCalendarPreview() {
  return (
    <FadeIn delay={0.12}>
      <div className="landing-preview-card on-paper">
        <p className="landing-preview-card__label">Live on the wall</p>
        <h2 className="landing-preview-card__title">Overlap lights up</h2>

        <div className="mt-4 space-y-3">
          <div className="flex items-center justify-between gap-2">
            <span className="font-display text-sm font-bold text-[var(--paper-ink)]">
              This week
            </span>
            <StatusBadge variant="overlap">3 available</StatusBadge>
          </div>

          <div className="grid grid-cols-7 gap-0.5 border-b-2 border-paper-border pb-2">
            {DAYS.map((label, i) => (
              <div
                key={label}
                className="flex flex-col items-center gap-0.5 text-center"
              >
                <span className="font-display text-[9px] font-bold uppercase tracking-wide text-[var(--paper-ink-muted)]">
                  {label}
                </span>
                <span className="font-mono text-xs font-bold tabular-nums text-[var(--paper-ink)]">
                  {12 + i}
                </span>
                {i === 3 ? (
                  <HolidayDayChip name="Victoria Day" compact className="max-w-full" />
                ) : null}
              </div>
            ))}
          </div>

          <div className="ruled-paper relative grid grid-cols-[32px_1fr] gap-2 rounded-sm border-2 border-dashed border-paper-border bg-[var(--paper-inset-bg)] p-2">
            <div className="flex flex-col justify-between py-1 font-mono text-[9px] font-semibold text-[var(--paper-ink-muted)]">
              <span>18</span>
              <span>20</span>
              <span>22</span>
            </div>
            <div className="relative h-[152px]">
              <div
                className="absolute inset-0 rounded-sm bg-[color-mix(in_oklch,var(--overlap)_14%,transparent)]"
                aria-hidden
              />
              <div className="crayon-overlap-scribble crayon-texture absolute inset-x-1.5 top-5 bottom-8 rounded-sm" />
              <div className="absolute inset-x-1.5 top-5 bottom-8 flex flex-col justify-between p-2">
                <div
                  className="crayon-texture h-3.5 w-[72%] rounded-sm border-2 border-[var(--crayon-stroke)]"
                  style={{
                    backgroundColor:
                      "color-mix(in oklch, var(--primary) 58%, transparent)",
                  }}
                  title="Your availability"
                />
                <div className="flex items-center gap-2">
                  <div className="flex -space-x-2">
                    {(["Alex", "Sam", "Jo"] as const).map((name) => (
                      <UserAvatar key={name} name={name} size="xs" />
                    ))}
                  </div>
                  <span className="font-display text-sm font-bold leading-tight text-[var(--paper-ink)]">
                    3 free · 20:00–22:00
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </FadeIn>
  );
}
