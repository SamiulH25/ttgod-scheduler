import Link from "next/link";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Calendar, Check, Globe, Users } from "lucide-react";

type OnboardingBannerProps = {
  timezone: string;
  hasAvailability: boolean;
  onComplete?: () => void;
};

export function OnboardingBanner({
  timezone,
  hasAvailability,
}: OnboardingBannerProps) {
  const steps = [
    { done: true, icon: Globe, label: `Timezone: ${timezone}` },
    {
      done: hasAvailability,
      icon: Calendar,
      label: "Draw your first crayon block",
      href: "/availability",
    },
    { done: false, icon: Users, label: "Invite friends via Discord bot" },
  ];

  return (
    <Card tiltId="onboarding" tape className="border-dashed border-primary/40">
      <CardContent className="pt-5">
        <h2 className="font-display text-2xl font-bold">Getting started</h2>
        <p className="mt-1 font-sans text-muted-foreground">
          Tape these to-dos to your wall.
        </p>
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
                  <Link href={step.href}>Calendar</Link>
                </Button>
              )}
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
