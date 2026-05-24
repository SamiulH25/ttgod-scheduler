"use client";

import { FadeIn } from "@/components/motion/fade-in";

const LANDING_LOOP = [
  {
    title: "Post availability",
    desc: "Drag crayon blocks for when you're free on the shared wall.",
  },
  {
    title: "Spot overlap",
    desc: "The hub highlights when your squad lines up.",
  },
  {
    title: "Run a campaign",
    desc: "Gather interest, open a poll, pin the winning slot.",
  },
  {
    title: "Plans & photos",
    desc: "Itinerary, resources, and expenses after you lock time.",
  },
] as const;

export function LandingSteps() {
  return (
    <section aria-labelledby="landing-how-heading">
      <FadeIn>
        <h2 id="landing-how-heading" className="landing-section-title wall-title">
          How it works
        </h2>
        <p className="landing-section-lead wall-subtitle">
          Four steps from crayon on plaster to a pinned session.
        </p>
      </FadeIn>
      <ol className="landing-steps-grid list-none p-0">
        {LANDING_LOOP.map((step, i) => (
          <li key={step.title}>
            <FadeIn delay={0.06 + i * 0.05} className="h-full">
              <article className="landing-step on-paper h-full">
                <span className="landing-step__num" aria-hidden>
                  {i + 1}
                </span>
                <h3 className="landing-step__title">{step.title}</h3>
                <p className="landing-step__desc">{step.desc}</p>
              </article>
            </FadeIn>
          </li>
        ))}
      </ol>
    </section>
  );
}
