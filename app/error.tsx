"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="app-page flex min-h-[50vh] flex-col items-center justify-center gap-4 px-4 text-center">
      <h1 className="wall-title text-2xl">Something went wrong</h1>
      <p className="wall-subtitle max-w-md text-sm">
        An unexpected error occurred. Try again, or return home.
      </p>
      {error.digest ? (
        <p className="font-mono text-xs text-[var(--paper-ink-muted)]">
          Reference: {error.digest}
        </p>
      ) : null}
      <div className="flex flex-wrap justify-center gap-2">
        <Button type="button" onClick={() => reset()}>
          Try again
        </Button>
        <Button variant="outline" asChild>
          <Link href="/dashboard">Go to dashboard</Link>
        </Button>
      </div>
    </div>
  );
}
