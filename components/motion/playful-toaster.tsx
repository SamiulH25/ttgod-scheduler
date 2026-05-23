"use client";

import { Toaster as SonnerToaster } from "sonner";

export function PlayfulToaster() {
  return (
    <SonnerToaster
      richColors
      position="top-right"
      closeButton
      toastOptions={{
        classNames: {
          toast:
            "paper-sheet font-display text-base font-semibold text-[var(--paper-ink)] border-[var(--crayon-stroke)] animate-toast-enter",
          success: "animate-toast-wiggle",
          error: "animate-toast-shake",
        },
      }}
    />
  );
}
