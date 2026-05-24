"use client";

import { UserAvatar } from "@/components/user-avatar";
import { summarizeCampaignInterest } from "@/lib/campaign-interest";
import { cn } from "@/lib/utils";
import { Check } from "lucide-react";

type CampaignPhaseFlowProps = {
  phase: string;
  isHost: boolean;
  participants: {
    userId: string | null;
    status: string;
    user?: { id: string; name: string | null; image: string | null } | null;
  }[];
};

const STEPS = [
  { key: "interest", label: "Interest", short: "Who's in?" },
  { key: "scheduling", label: "Find times", short: "Vote on slots" },
  { key: "scheduled", label: "Pinned", short: "Session set" },
] as const;

function stepState(
  key: (typeof STEPS)[number]["key"],
  phase: string,
): "done" | "current" | "upcoming" {
  const order = ["interest", "scheduling", "scheduled"] as const;
  const phaseIdx = order.indexOf(phase as (typeof order)[number]);
  const keyIdx = order.indexOf(key);
  if (phaseIdx < 0) return "upcoming";
  if (keyIdx < phaseIdx) return "done";
  if (keyIdx === phaseIdx) return "current";
  return "upcoming";
}

export function CampaignPhaseFlow({
  phase,
  isHost,
  participants,
}: CampaignPhaseFlowProps) {
  if (phase === "scheduled") return null;

  const stats = summarizeCampaignInterest(participants);

  return (
    <div className="space-y-4">
      <nav aria-label="Campaign progress">
        <ol className="grid gap-2 sm:grid-cols-3">
          {STEPS.map((step, i) => {
            const state = stepState(step.key, phase);
            return (
              <li
                key={step.key}
                className={cn(
                  "relative flex flex-col gap-1 rounded-sm border-2 px-3 py-2.5 transition-colors",
                  state === "current" &&
                    "border-primary bg-primary/10 shadow-[inset_0_0_0_1px_color-mix(in_oklch,var(--primary)_25%,transparent)]",
                  state === "done" &&
                    "border-[var(--crayon-stroke)] bg-[color-mix(in_oklch,var(--paper-cream)_70%,var(--primary)_8%)]",
                  state === "upcoming" &&
                    "border-dashed border-[var(--ink-pencil)]/50 bg-transparent",
                )}
              >
                <div className="flex items-center gap-2">
                  <span
                    className={cn(
                      "flex size-6 shrink-0 items-center justify-center rounded-full text-[11px] font-bold",
                      state === "current" && "bg-primary text-primary-foreground",
                      state === "done" &&
                        "bg-[var(--crayon-stroke)] text-[var(--paper-cream)]",
                      state === "upcoming" &&
                        "bg-muted text-[var(--paper-ink-muted)]",
                    )}
                    aria-hidden
                  >
                    {state === "done" ? (
                      <Check className="size-3.5 stroke-[3]" />
                    ) : (
                      i + 1
                    )}
                  </span>
                  <span
                    className={cn(
                      "font-display text-sm font-bold leading-tight",
                      state === "upcoming" && "text-[var(--paper-ink-muted)]",
                    )}
                  >
                    {step.label}
                  </span>
                </div>
                <span
                  className={cn(
                    "pl-8 text-xs font-medium",
                    state === "current"
                      ? "text-[var(--paper-ink)]"
                      : "text-[var(--paper-ink-muted)]",
                  )}
                >
                  {step.short}
                </span>
              </li>
            );
          })}
        </ol>
      </nav>

      <div className="flex flex-wrap gap-2">
        <span className="inline-flex items-center rounded-full border-2 border-[var(--overlap)] bg-[var(--overlap)]/25 px-2.5 py-0.5 font-display text-xs font-bold text-[var(--overlap-foreground)]">
          {stats.interested.length} interested
        </span>
        <span className="inline-flex items-center rounded-full border border-[var(--crayon-stroke)]/40 bg-[color-mix(in_oklch,var(--paper-cream)_85%,var(--muted)_15%)] px-2.5 py-0.5 font-mono text-xs font-semibold tabular-nums text-[var(--paper-ink-muted)]">
          {stats.awaiting.length} awaiting reply
        </span>
        {stats.notInterested.length > 0 && (
          <span className="inline-flex items-center rounded-full border border-[var(--crayon-stroke)]/30 px-2.5 py-0.5 font-mono text-xs text-[var(--paper-ink-muted)]">
            {stats.notInterested.length} out
          </span>
        )}
      </div>

      <p className="paper-callout text-sm leading-relaxed">
        {phase === "interest" ? (
          isHost ? (
            <>
              <span className="font-display font-bold">Host tip:</span> Wait for
              yes votes, then open the scheduling poll below. Only members who
              are in (or haven&apos;t replied) count toward squad time
              suggestions.
            </>
          ) : (
            <>
              <span className="font-display font-bold">Your move:</span> Say if
              you&apos;re in — the host opens time slots once enough of the squad
              responds.
            </>
          )
        ) : (
          <>
            <span className="font-display font-bold">Poll live</span> for{" "}
            {stats.schedulingRosterCount} member
            {stats.schedulingRosterCount === 1 ? "" : "s"}. Add slots, vote, and
            finalize when ready.
          </>
        )}
      </p>

      {stats.interested.length > 0 && (
        <div className="flex flex-wrap items-center gap-3">
          <span className="font-display text-xs font-bold uppercase tracking-wide text-[var(--paper-ink-muted)]">
            In the squad
          </span>
          <div className="flex -space-x-2">
            {stats.interested.slice(0, 12).map((p) => (
              <UserAvatar
                key={p.userId!}
                name={p.user?.name ?? null}
                image={p.user?.image ?? null}
                size="sm"
                className="ring-2 ring-[var(--paper-cream)]"
              />
            ))}
          </div>
          {stats.interested.length > 12 && (
            <span className="text-xs font-semibold text-[var(--paper-ink-muted)]">
              +{stats.interested.length - 12}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
