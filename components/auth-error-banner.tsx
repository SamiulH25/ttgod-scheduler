"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";

const MESSAGES: Record<
  string,
  { title: string; description: string; showDemoHint?: boolean }
> = {
  OAuthAccountNotLinked: {
    title: "Discord account not linked",
    description:
      "An account with this email already exists (often from local demo sign-in). Sign in with demo using the same email, or reset your local database and use Discord only.",
    showDemoHint: true,
  },
  AccessDenied: {
    title: "Sign-in was denied",
    description:
      "Something failed while saving your profile. Restart the dev server and try Discord sign-in again.",
  },
  Configuration: {
    title: "Auth is misconfigured",
    description: "Check AUTH_SECRET and Discord OAuth credentials on the server.",
  },
  CredentialsSignin: {
    title: "Demo sign-in failed",
    description: "Could not create or load the demo user.",
  },
};

type AuthErrorBannerProps = {
  error?: string | null;
  devAuthEnabled?: boolean;
};

export function AuthErrorBanner({
  error,
  devAuthEnabled = false,
}: AuthErrorBannerProps) {
  if (!error) return null;

  const info = MESSAGES[error] ?? {
    title: "Sign-in error",
    description: `Error code: ${error}`,
  };

  return (
    <div
      className="paper-sheet mt-4 border-destructive/40 bg-destructive/5 px-4 py-3"
      role="alert"
      style={{ "--paper-tilt": "0.4deg" } as Record<string, string>}
    >
      <p className="font-display text-lg font-bold text-destructive">
        {info.title}
      </p>
      <p className="mt-1 font-sans text-sm text-muted-foreground">
        {info.description}
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        <Button type="button" size="sm" variant="outline" asChild>
          <Link href="/">Try again</Link>
        </Button>
        {devAuthEnabled && info.showDemoHint && (
          <p className="w-full text-xs text-muted-foreground">
            Or use <strong>Local demo only</strong> below with a different name.
          </p>
        )}
      </div>
    </div>
  );
}
