"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ChevronDown, ChevronRight, ListChecks } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const STORAGE_PREFIX = "ttgod-host-playbook-collapsed:";

type HostPlaybookProps = {
  eventId: string;
  phase: string;
  isHost: boolean;
  hasProposals: boolean;
  isPinned: boolean;
};

const STEPS = [
  {
    key: "interest",
    label: "Invite & gather interest",
    hint: "Add squad + copy invite link. Wait for yes/no before opening times.",
    anchor: "#campaign-invites",
  },
  {
    key: "scheduling",
    label: "Scheduling",
    hint: "Open the poll only after interest is in. Add ranked squad slots.",
    anchor: "#campaign-scheduling",
  },
  {
    key: "pin",
    label: "Pin a time",
    hint: "Finalize the winning slot after conflict check.",
    anchor: "#campaign-scheduling",
  },
  {
    key: "plans",
    label: "Plans & expenses",
    hint: "Itinerary, costs, and photos after pin.",
    anchor: "#campaign-plans",
  },
] as const;

function stepDone(
  key: (typeof STEPS)[number]["key"],
  phase: string,
  hasProposals: boolean,
  isPinned: boolean,
): boolean {
  if (key === "interest") {
    return phase !== "interest";
  }
  if (key === "scheduling") {
    return phase === "scheduling" && hasProposals;
  }
  if (key === "pin") {
    return isPinned;
  }
  if (key === "plans") {
    return isPinned;
  }
  return false;
}

export function HostPlaybook({
  eventId,
  phase,
  isHost,
  hasProposals,
  isPinned,
}: HostPlaybookProps) {
  const [collapsed, setCollapsed] = useState(true);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(`${STORAGE_PREFIX}${eventId}`);
      if (stored === "0") setCollapsed(false);
    } catch {
      /* ignore */
    }
  }, [eventId]);

  if (!isHost) return null;

  function toggleCollapsed() {
    const next = !collapsed;
    setCollapsed(next);
    try {
      localStorage.setItem(`${STORAGE_PREFIX}${eventId}`, next ? "1" : "0");
    } catch {
      /* ignore */
    }
  }

  return (
    <div className="paper-panel on-paper overflow-hidden">
      <button
        type="button"
        className="flex w-full items-center gap-2 px-4 py-3 text-left hover:bg-[color-mix(in_oklch,var(--paper-cream)_90%,var(--primary)_10%)]"
        onClick={toggleCollapsed}
      >
        {collapsed ? (
          <ChevronRight className="size-4 shrink-0 text-[var(--paper-ink)]" />
        ) : (
          <ChevronDown className="size-4 shrink-0 text-[var(--paper-ink)]" />
        )}
        <ListChecks className="size-4 text-primary" />
        <span className="font-display text-sm font-bold text-[var(--paper-ink)]">
          Host playbook
        </span>
        <span className="ml-auto rounded-sm bg-primary/12 px-2 py-0.5 font-display text-[10px] font-bold uppercase tracking-wide text-[var(--paper-ink)]">
          {PHASE_LABEL(phase)}
        </span>
      </button>
      {!collapsed && (
        <ol className="space-y-2 border-t border-paper-border px-4 py-3">
          {STEPS.map((step, i) => {
            const done = stepDone(step.key, phase, hasProposals, isPinned);
            return (
              <li key={step.key} className="flex gap-2 text-sm">
                <span
                  className={cn(
                    "mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold",
                    done
                      ? "bg-primary text-primary-foreground"
                      : "bg-[var(--paper-inset-bg)] text-[var(--paper-ink-muted)]",
                  )}
                >
                  {done ? "✓" : i + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="font-display font-bold text-[var(--paper-ink)]">
                    {step.label}
                  </p>
                  <p className="text-xs text-[var(--paper-ink-muted)]">{step.hint}</p>
                  <Button
                    type="button"
                    variant="link"
                    size="sm"
                    className="h-auto px-0 py-0 text-xs"
                    asChild
                  >
                    <Link href={step.anchor}>Go</Link>
                  </Button>
                </div>
              </li>
            );
          })}
        </ol>
      )}
    </div>
  );
}

function PHASE_LABEL(phase: string): string {
  if (phase === "interest") return "Interest";
  if (phase === "scheduling") return "Scheduling";
  if (phase === "scheduled") return "Pinned";
  return phase;
}
