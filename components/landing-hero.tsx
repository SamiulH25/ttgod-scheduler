"use client";

import { FadeIn } from "@/components/motion/fade-in";
import { LandingCalendarPreview } from "@/components/landing-calendar-preview";

type LandingHeroProps = {
  appName: string;
  children: React.ReactNode;
};

export function LandingHero({ appName, children }: LandingHeroProps) {
  return (
    <div className="grid items-center gap-12 lg:grid-cols-[1.15fr_0.85fr] lg:gap-20">
      <div>
        <FadeIn delay={0}>
          <p className="prose-label">Team scheduling</p>
        </FadeIn>
        <FadeIn delay={0.06}>
          <h1 className="mt-3 font-display text-4xl font-semibold tracking-tight sm:text-5xl lg:text-[3.4rem] lg:leading-[1.1]">
            {appName}
          </h1>
        </FadeIn>
        <FadeIn delay={0.12}>
          <p className="mt-4 max-w-md text-lg text-muted-foreground leading-relaxed">
            Find when everyone is free, lock a session, and keep Discord in sync.
          </p>
        </FadeIn>
        <FadeIn delay={0.18}>{children}</FadeIn>
      </div>
      <FadeIn delay={0.1} y={16}>
        <LandingCalendarPreview />
      </FadeIn>
    </div>
  );
}
