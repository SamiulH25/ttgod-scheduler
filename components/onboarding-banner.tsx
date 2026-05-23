"use client";

import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";
import { StampMotion } from "@/components/motion/stamp-pop";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Calendar, Check, Globe, Users, X } from "lucide-react";
import { useReducedMotion } from "@/lib/use-reduced-motion";

type OnboardingBannerProps = {
  timezone: string;
  hasAvailability: boolean;
  onComplete?: () => void;
};

type OnboardingStats = {
  postedAvailability: boolean;
  joinedCampaign: boolean;
  onboardingCompleted: boolean;
};

export function OnboardingBanner({
  timezone,
  hasAvailability,
}: OnboardingBannerProps) {
  const reduced = useReducedMotion();
  const [dismissed, setDismissed] = useState(false);
  const [dismissStamp, setDismissStamp] = useState(0);
  const [stats, setStats] = useState<OnboardingStats | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/user/onboarding")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (!cancelled && d?.steps) {
          setStats({
            postedAvailability: d.steps.hasAvailability,
            joinedCampaign: d.steps.joinedCampaign,
            onboardingCompleted: d.steps.onboardingMarkedDone,
          });
        }
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  const posted = stats?.postedAvailability ?? hasAvailability;
  const joined = stats?.joinedCampaign ?? false;
  const markedDone = stats?.onboardingCompleted ?? false;

  const steps = [
    { done: true, icon: Globe, label: `Timezone: ${timezone}` },
    {
      done: posted,
      icon: Calendar,
      label: "Draw your first crayon block",
      href: "/availability",
    },
    {
      done: joined,
      icon: Users,
      label: "Join or host a campaign",
      href: "/events",
    },
    {
      done: markedDone,
      icon: Check,
      label: "Finish onboarding checklist",
      href: "/settings",
    },
  ];

  const content = (
    <Card tiltId="onboarding" tape className="border-dashed border-primary/40">
      <CardContent className="pt-5">
        <div className="flex items-start justify-between gap-2">
          <div>
            <h2 className="font-display text-2xl font-bold">Getting started</h2>
            <p className="mt-1 font-sans text-muted-foreground">
              Tape these to-dos to your wall.
            </p>
          </div>
          <StampMotion animationKey={dismissStamp}>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="shrink-0"
              aria-label="Dismiss getting started"
              onClick={() => {
                setDismissStamp((k) => k + 1);
                window.setTimeout(() => setDismissed(true), 180);
              }}
            >
              <X className="size-4" />
            </Button>
          </StampMotion>
        </div>
        <ul className="mt-4 space-y-3">
          {steps.map((step) => (
            <li key={step.label} className="flex items-center gap-3">
              <span
                className={cn(
                  "flex h-9 w-9 items-center justify-center border-[3px] border-[var(--crayon-stroke)]",
                  step.done
                    ? "bg-primary/20 text-primary"
                    : "bg-muted text-muted-foreground",
                )}
              >
                {step.done ? (
                  <Check className="h-4 w-4" />
                ) : (
                  <step.icon className="h-4 w-4" />
                )}
              </span>
              <span
                className={cn(
                  "font-sans text-base",
                  step.done && "text-muted-foreground line-through",
                )}
              >
                {step.label}
              </span>
              {step.href && !step.done && (
                <Button asChild size="sm" variant="sticker" className="ml-auto">
                  <Link href={step.href}>Open</Link>
                </Button>
              )}
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );

  if (reduced) {
    return dismissed ? null : content;
  }

  return (
    <AnimatePresence>
      {!dismissed && (
        <motion.div
          key="onboarding"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -16 }}
          transition={{ duration: 0.35 }}
        >
          {content}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
