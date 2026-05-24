"use client";

import { FadeIn } from "@/components/motion/fade-in";

type LandingHeroProps = {
  appName: string;
  children: React.ReactNode;
};

export function LandingHero({ appName, children }: LandingHeroProps) {
  return (
    <article className="landing-poster on-paper">
      <FadeIn delay={0}>
        <p className="landing-poster__eyebrow">
          <span className="landing-poster__eyebrow-dot" aria-hidden />
          Squad scheduling
        </p>
      </FadeIn>
      <FadeIn delay={0.05}>
        <h1 className="landing-poster__title">{appName}</h1>
      </FadeIn>
      <FadeIn delay={0.1}>
        <p className="landing-poster__lead">
          Pin when everyone&apos;s free. Run campaigns. Keep the Discord squad on
          the same wall.
        </p>
      </FadeIn>
      <FadeIn delay={0.14}>
        <p className="landing-poster__body">
          Post crayon availability, see overlap light up, gather votes, and lock a
          session — no spreadsheet archaeology.
        </p>
      </FadeIn>
      <FadeIn delay={0.18}>
        <div className="landing-poster__cta space-y-4">{children}</div>
      </FadeIn>
    </article>
  );
}
