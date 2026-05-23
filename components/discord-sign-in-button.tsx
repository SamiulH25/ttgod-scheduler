"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type DiscordSignInButtonProps = {
  callbackUrl?: string;
  size?: "default" | "sm" | "lg";
  className?: string;
  /** When false, click shows a message instead of redirecting with an empty client_id. */
  configured?: boolean;
};

/** Discord brand mark (simple SVG) */
function DiscordIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      aria-hidden
      fill="currentColor"
    >
      <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C1.566 7.76.96 11.09 1.177 14.38a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 1.528 1.528 0 0 0 1.226-1.994.076.076 0 0 0-.041-.043 13.1 13.1 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.3 12.3 0 0 1-1.873.892.077.077 0 0 0-.041.043 1.52 1.52 0 0 0 1.227 1.993.076.076 0 0 0 .084.028 19.876 19.876 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.36-3.87-.61-7.17-2.617-9.983a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
    </svg>
  );
}

export function DiscordSignInButton({
  callbackUrl = "/dashboard",
  size = "lg",
  className,
  configured = true,
}: DiscordSignInButtonProps) {
  const [pending, setPending] = useState(false);
  const [configError, setConfigError] = useState<string | null>(null);

  async function handleSignIn() {
    if (!configured) {
      setConfigError(
        "Discord sign-in is not set up on this server yet. Add your Discord application Client ID and Secret to the server environment, or use local demo sign-in below.",
      );
      return;
    }

    setConfigError(null);
    setPending(true);
    try {
      await signIn("discord", { callbackUrl, redirect: true });
    } catch {
      setPending(false);
    }
  }

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <Button
        type="button"
        size={size}
        disabled={pending}
        onClick={() => void handleSignIn()}
        className={cn(
          "gap-2 bg-[#5865F2] text-white hover:bg-[#4752C4] focus-visible:ring-[#5865F2]",
          !configured && "opacity-90",
        )}
      >
        <DiscordIcon className="size-5" />
        {pending ? "Opening Discord…" : "Sign in with Discord"}
      </Button>
      {configError ? (
        <p className="max-w-md text-sm text-destructive" role="alert">
          {configError}
        </p>
      ) : null}
    </div>
  );
}
