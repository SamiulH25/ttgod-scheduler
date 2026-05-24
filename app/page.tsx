import { auth } from "@/auth";

import { DevSignInForm } from "@/components/dev-sign-in-form";

import { AuthErrorBanner } from "@/components/auth-error-banner";

import { LandingCalendarPreview } from "@/components/landing-calendar-preview";

import { LandingHero } from "@/components/landing-hero";

import { LandingSignIn } from "@/components/landing-sign-in";

import { LandingSteps } from "@/components/landing-steps";

import { LogoMark } from "@/components/logo-mark";

import { isDiscordOAuthConfigured } from "@/lib/discord-oauth";

import Link from "next/link";
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

    <div className="landing-page">

      <div className="landing-page__inner">

        <header className="landing-header mx-auto max-w-6xl">

          <LogoMark className="wall-title text-[var(--foreground)]" />

        </header>



        <main className="landing-main">

          <div className="landing-hero-grid">

            <LandingHero appName={appName}>

              {needsSignIn && (

                <p className="paper-callout on-paper text-sm font-medium">

                  Sign in to open your dashboard and calendar.

                </p>

              )}

              <LandingSignIn

                callbackUrl={redirectTo}

                configured={discordConfigured}

              />

              <AuthErrorBanner

                error={params.error}

                devAuthEnabled={devAuthEnabled}

              />

              {devAuthEnabled && (

                <details className="landing-dev-details on-paper">

                  <summary>Local developer sign-in</summary>

                  <div className="landing-dev-details__body">

                    <p className="mb-3 text-xs font-medium text-[var(--paper-ink-muted)]">

                      Skip Discord OAuth while developing locally.

                    </p>

                    <DevSignInForm redirectTo={redirectTo} />

                  </div>

                </details>

              )}

            </LandingHero>



            <div className="landing-preview-wrap">

              <LandingCalendarPreview />

            </div>

          </div>



          <hr className="landing-divider" aria-hidden />



          <LandingSteps />

        </main>

        <footer className="landing-footer mx-auto max-w-6xl pb-8 text-center text-sm text-[var(--foreground)]/70">
          <Link href="/privacy" className="underline hover:text-[var(--foreground)]">
            Privacy
          </Link>
        </footer>

      </div>

    </div>

  );

}

