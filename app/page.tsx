import { auth } from "@/auth";

import { DevSignInForm } from "@/components/dev-sign-in-form";

import { DiscordSignInButton } from "@/components/discord-sign-in-button";

import { LandingHero } from "@/components/landing-hero";

import { LandingSteps } from "@/components/landing-steps";

import { LogoMark } from "@/components/logo-mark";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import { AuthErrorBanner } from "@/components/auth-error-banner";
import { isDiscordOAuthConfigured } from "@/lib/discord-oauth";
import { redirect } from "next/navigation";

const appName = process.env.NEXT_PUBLIC_APP_NAME ?? "TTGOD Scheduler";

const devAuthEnabled = process.env.NODE_ENV === "development";



export default async function HomePage({

  searchParams,

}: {

  searchParams: Promise<{ callbackUrl?: string; signin?: string; error?: string }>;

}) {

  const session = await auth();

  const params = await searchParams;

  const redirectTo = params.callbackUrl ?? "/dashboard";



  if (session?.user) {

    redirect(redirectTo);

  }



  const needsSignIn = params.signin === "required" || Boolean(params.callbackUrl);
  const discordConfigured = isDiscordOAuthConfigured();

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
            <AuthErrorBanner error={params.error} devAuthEnabled={devAuthEnabled} />
            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-start">

              <DiscordSignInButton
                callbackUrl={redirectTo}
                configured={discordConfigured}
                className="w-full sm:w-auto"
              />

              {devAuthEnabled && (

                <Card tiltId="demo-signin" className="w-full border-dashed sm:max-w-xs">

                  <CardHeader className="pb-2">

                    <CardTitle className="text-xl">Local demo only</CardTitle>

                  </CardHeader>

                  <CardContent>

                    <p className="mb-3 text-xs text-muted-foreground">

                      Skip Discord OAuth while developing locally.

                    </p>

                    <DevSignInForm redirectTo={redirectTo} />

                  </CardContent>

                </Card>

              )}

            </div>

          </>

        </LandingHero>



        <LandingSteps />

      </main>

    </div>

  );

}


