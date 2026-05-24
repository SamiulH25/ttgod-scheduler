"use client";

import { DiscordSignInButton } from "@/components/discord-sign-in-button";

type LandingSignInProps = {
  callbackUrl: string;
  configured: boolean;
};

export function LandingSignIn({ callbackUrl, configured }: LandingSignInProps) {
  return (
    <div className="w-full max-w-md space-y-2.5">
      <DiscordSignInButton
        callbackUrl={callbackUrl}
        configured={configured}
        size="lg"
        className="w-full [&_button]:h-12 [&_button]:text-base [&_button]:shadow-[0_4px_0_#3c45a8] [&_button]:transition-[transform,box-shadow] [&_button]:hover:translate-y-px [&_button]:hover:shadow-[0_3px_0_#3c45a8] [&_button]:active:translate-y-0.5 [&_button]:active:shadow-[0_2px_0_#3c45a8]"
      />
      <p className="landing-cta-note">
        Free for your Discord server. Sign-in only identifies you — we don&apos;t
        post on your behalf.
      </p>
    </div>
  );
}
