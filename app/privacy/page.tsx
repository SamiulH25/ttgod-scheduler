import Link from "next/link";
import { PageContainer } from "@/components/layout/page-container";

export const metadata = {
  title: "Privacy — TTGOD Scheduler",
};

export default function PrivacyPage() {
  return (
    <PageContainer className="max-w-2xl py-10">
      <h1 className="wall-title text-3xl">Privacy</h1>
      <p className="wall-subtitle mt-2 text-sm">
        Friends-only beta. This page describes what the app stores and why.
      </p>

      <div className="paper-panel mt-8 space-y-6 p-6 text-sm text-[var(--paper-ink)]">
        <section>
          <h2 className="paper-panel-title text-lg">What we collect</h2>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            <li>
              <strong>Discord profile</strong> — user id, display name, and
              avatar when you sign in with Discord.
            </li>
            <li>
              <strong>Availability</strong> — time blocks, status (free /
              tentative / busy), and optional notes you enter on the calendar.
            </li>
            <li>
              <strong>Campaign data</strong> — events you create or join, votes,
              plans, expenses, and photos you upload.
            </li>
            <li>
              <strong>Preferences</strong> — timezone, theme, notification
              settings, and optional weather location.
            </li>
          </ul>
        </section>

        <section>
          <h2 className="paper-panel-title text-lg">How we use it</h2>
          <p className="mt-2">
            Data is used only to run squad scheduling: overlaps, campaigns,
            invites, and the Discord bot API (if your host enables it). We do
            not sell data or run advertising.
          </p>
        </section>

        <section>
          <h2 className="paper-panel-title text-lg">Cookies & sessions</h2>
          <p className="mt-2">
            Sign-in uses a session cookie managed by Auth.js. No third-party
            analytics cookies are used in this beta.
          </p>
        </section>

        <section>
          <h2 className="paper-panel-title text-lg">Your choices</h2>
          <p className="mt-2">
            You can delete availability blocks and leave campaigns from the app.
            To remove your account entirely, contact the person who runs this
            instance.
          </p>
        </section>

        <p className="text-[var(--paper-ink-muted)]">
          <Link href="/" className="underline">
            Back to home
          </Link>
        </p>
      </div>
    </PageContainer>
  );
}
