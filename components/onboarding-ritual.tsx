"use client";

import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
import { useCallback, useEffect, useState } from "react";
import { StampMotion } from "@/components/motion/stamp-pop";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { Calendar, Check, KeyRound } from "lucide-react";
import { useReducedMotion } from "@/lib/use-reduced-motion";

type GuildRow = { id: string; name: string; joinCode: string | null };

type OnboardingRitualProps = {
  timezone: string;
  hasAvailability: boolean;
};

export function OnboardingRitual({
  timezone,
  hasAvailability,
}: OnboardingRitualProps) {
  const reduced = useReducedMotion();
  const [dismissed, setDismissed] = useState(false);
  const [dismissStamp, setDismissStamp] = useState(0);
  const [posted, setPosted] = useState(hasAvailability);
  const [guilds, setGuilds] = useState<GuildRow[]>([]);
  const [activeGuildId, setActiveGuildId] = useState<string | null>(null);
  const [joinBusy, setJoinBusy] = useState(false);

  useEffect(() => {
    setPosted(hasAvailability);
  }, [hasAvailability]);

  const loadGuilds = useCallback(async () => {
    const res = await fetch("/api/guilds");
    if (!res.ok) return;
    const data = await res.json();
    setGuilds(data.guilds ?? []);
    setActiveGuildId(data.activeGuildId ?? null);
  }, []);

  useEffect(() => {
    void loadGuilds();
  }, [loadGuilds]);

  const activeGuild = guilds.find((g) => g.id === activeGuildId) ?? guilds[0];
  const joinCode = activeGuild?.joinCode ?? null;

  async function ensureJoinCode() {
    setJoinBusy(true);
    const res = await fetch("/api/guilds", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ regenerateJoinCode: true }),
    });
    setJoinBusy(false);
    if (!res.ok) return;
    await loadGuilds();
  }

  async function copyJoinCode() {
    if (!joinCode) return;
    await navigator.clipboard.writeText(joinCode);
  }

  const content = (
    <Card tiltId="onboarding-ritual" tape className="border-dashed border-primary/40">
      <CardContent className="pt-5">
        <div className="flex items-start justify-between gap-2">
          <div>
            <h2 className="font-display text-2xl font-bold">First crayon ritual</h2>
            <p className="mt-1 font-sans text-sm text-muted-foreground">
              Two steps — timezone is {timezone}.
            </p>
          </div>
          <StampMotion animationKey={dismissStamp}>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="shrink-0"
              aria-label="Dismiss onboarding"
              onClick={() => {
                setDismissStamp((k) => k + 1);
                window.setTimeout(() => setDismissed(true), 180);
              }}
            >
              <span className="text-lg leading-none">×</span>
            </Button>
          </StampMotion>
        </div>
        <ol className="mt-4 space-y-4">
          <li className="flex gap-3">
            <span
              className={cn(
                "flex h-9 w-9 shrink-0 items-center justify-center border-[3px] border-[var(--crayon-stroke)]",
                posted
                  ? "bg-primary/20 text-primary"
                  : "bg-muted text-muted-foreground",
              )}
            >
              {posted ? <Check className="h-4 w-4" /> : <Calendar className="h-4 w-4" />}
            </span>
            <div className="min-w-0 flex-1">
              <p
                className={cn(
                  "font-sans text-base font-medium",
                  posted && "text-muted-foreground line-through",
                )}
              >
                Draw your first availability block
              </p>
              {!posted && (
                <Button asChild size="sm" variant="sticker" className="mt-2">
                  <Link href="/availability">Open calendar</Link>
                </Button>
              )}
            </div>
          </li>
          <li className="flex gap-3">
            <span
              className={cn(
                "flex h-9 w-9 shrink-0 items-center justify-center border-[3px] border-[var(--crayon-stroke)]",
                joinCode ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground",
              )}
            >
              {joinCode ? <Check className="h-4 w-4" /> : <KeyRound className="h-4 w-4" />}
            </span>
            <div className="min-w-0 flex-1">
              <p className="font-sans text-base font-medium">
                Copy squad invite for Discord
              </p>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                {joinCode ? (
                  <>
                    <code className="rounded border bg-muted px-2 py-1 font-mono text-sm">
                      {joinCode}
                    </code>
                    <Button type="button" size="sm" variant="outline" onClick={() => void copyJoinCode()}>
                      Copy code
                    </Button>
                    <Button asChild size="sm" variant="sticker">
                      <Link href="/squad">Team page</Link>
                    </Button>
                  </>
                ) : (
                  <Button
                    type="button"
                    size="sm"
                    variant="secondary"
                    disabled={joinBusy || !activeGuildId}
                    onClick={() => void ensureJoinCode()}
                  >
                    Mint join code
                  </Button>
                )}
              </div>
            </div>
          </li>
        </ol>
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
          key="onboarding-ritual"
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
