"use client";

import { motion } from "motion/react";
import { Card, CardContent } from "@/components/ui/card";
import { useReducedMotion } from "@/lib/use-reduced-motion";
import type { LucideIcon } from "lucide-react";

type Step = {
  icon: LucideIcon;
  title: string;
  desc: string;
};

export function LandingSteps({ steps }: { steps: Step[] }) {
  const reduced = useReducedMotion();

  return (
    <section className="mt-24 border-t-2 border-dashed border-border pt-16">
      <h2 className="font-display text-3xl font-bold">How it works</h2>
      <div className="relative mt-10 grid gap-6 md:grid-cols-3">
        {steps.map((step, i) => {
          const Icon = step.icon;
          const inner = (
            <Card
              tiltId={`step-${i}`}
              interactive
              tape
              className="relative z-10 h-full"
            >
              <CardContent className="pt-6">
                <div className="flex items-start gap-3">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center border-[3px] border-[var(--crayon-stroke)] bg-primary/15 font-display text-lg font-bold text-primary">
                    {i + 1}
                  </span>
                  <div>
                    <Icon className="mb-2 h-6 w-6 text-primary" />
                    <h3 className="font-display text-xl font-bold">{step.title}</h3>
                    <p className="mt-1 font-sans text-base text-muted-foreground leading-relaxed">
                      {step.desc}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          );

          if (reduced) {
            return <div key={step.title}>{inner}</div>;
          }

          return (
            <motion.div
              key={step.title}
              initial={{ opacity: 0, y: 20, rotate: -2 }}
              whileInView={{ opacity: 1, y: 0, rotate: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ duration: 0.4, delay: i * 0.1, ease: [0.22, 1, 0.36, 1] }}
            >
              {inner}
            </motion.div>
          );
        })}
      </div>
    </section>
  );
}
