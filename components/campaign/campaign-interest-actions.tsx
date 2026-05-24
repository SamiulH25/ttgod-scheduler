"use client";

import { StampMotion } from "@/components/motion/stamp-pop";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type CampaignInterestActionsProps = {
  phase: string;
  interested: boolean;
  notInterested: boolean;
  stampKey: number;
  onInterested: () => void;
  onNotInterested: () => void;
  className?: string;
};

export function CampaignInterestActions({
  phase,
  interested,
  notInterested,
  stampKey,
  onInterested,
  onNotInterested,
  className,
}: CampaignInterestActionsProps) {
  return (
    <div className={cn("grid gap-3 sm:grid-cols-2", className)}>
      <StampMotion animationKey={stampKey}>
        <Button
          type="button"
          size="lg"
          variant={interested ? "default" : "outline"}
          className="h-auto min-h-12 w-full justify-center py-3 font-display text-base"
          onClick={onInterested}
        >
          Yes, I&apos;m in
        </Button>
      </StampMotion>
      <StampMotion animationKey={stampKey}>
        <Button
          type="button"
          size="lg"
          variant={notInterested ? "default" : "outline"}
          className="h-auto min-h-12 w-full justify-center py-3 font-display text-base"
          onClick={onNotInterested}
        >
          Not this time
        </Button>
      </StampMotion>
      {phase === "scheduling" && (
        <p className="sm:col-span-2 text-center text-xs text-[var(--paper-ink-muted)]">
          You can change your answer until the host pins a time.
        </p>
      )}
    </div>
  );
}
