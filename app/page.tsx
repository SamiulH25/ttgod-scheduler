import { auth, signIn } from "@/auth";
import { DevSignInForm } from "@/components/dev-sign-in-form";
import { LandingHero } from "@/components/landing-hero";
import { LandingSteps } from "@/components/landing-steps";
import { LogoMark } from "@/components/logo-mark";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowRight, Calendar, LogIn, Users } from "lucide-react";
import { redirect } from "next/navigation";

const appName = process.env.NEXT_PUBLIC_APP_NAME ?? "TTGOD Scheduler";

const devAuthEnabled =
  process.env.NODE_ENV === "development" || process.env.DEV_AUTH_ENABLED === "true";

const discordConfigured =
  Boolean(process.env.AUTH_DISCORD_ID) && Boolean(process.env.AUTH_DISCORD_SECRET);

const steps = [
  { icon: LogIn, title: "Sign in", desc: "Link Discord so the bot knows it's you." },
  { icon: Calendar, title: "Mark availability", desc: "Draw free windows in crayon on the wall calendar." },
  { icon: Users, title: "Find overlap", desc: "Flip through weeks and see when everyone is free." },
];

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string; signin?: string }>;
}) {
  const session = await auth();
  const params = await searchParams;
  const redirectTo = params.callbackUrl ?? "/dashboard";

  if (session?.user) {
    redirect(redirectTo);
  }

  const needsSignIn = params.signin === "required" || Boolean(params.callbackUrl);

  return (
    <div className="relative min-h-screen bg-plaster-wall">
      <header className="paper-sheet tape-both tape-tl tape-tr border-b-2 border-dashed border-border">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
          <LogoMark />
        </div>
      </header>

      <main className="relative mx-auto max-w-6xl px-4 py-12 lg:py-20">
        <LandingHero appName={appName}>
          <>
            {needsSignIn && (
              <p
                className="paper-sheet mt-4 px-3 py-2 font-sans text-base"
                style={{ "--paper-tilt": "-0.5deg" } as Record<string, string>}
              >
                Sign in to peel open your dashboard.
              </p>
            )}
            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              {discordConfigured && (
                <form
                  action={async () => {
                    "use server";
                    await signIn("discord", { redirectTo });
                  }}
                >
                  <Button type="submit" size="lg" className="w-full sm:w-auto">
                    Sign in with Discord
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </form>
              )}
              {devAuthEnabled && (
                <Card tiltId="demo-signin" className="w-full border-dashed sm:max-w-xs">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-xl">Demo access</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <DevSignInForm redirectTo={redirectTo} />
                  </CardContent>
                </Card>
              )}
            </div>
          </>
        </LandingHero>

        <LandingSteps steps={steps} />
      </main>
    </div>
  );
}
