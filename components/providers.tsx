"use client";

import { AuthSessionProvider } from "@/components/session-provider";
import { APP_THEMES } from "@/lib/themes";
import { ThemeProvider } from "next-themes";
import { Toaster } from "sonner";

export function Providers({
  children,
  defaultTheme = "light",
}: {
  children: React.ReactNode;
  defaultTheme?: string;
}) {
  return (
    <AuthSessionProvider>
      <ThemeProvider
        attribute="data-theme"
        defaultTheme={defaultTheme}
        storageKey="ttgod-theme"
        themes={[...APP_THEMES]}
        enableSystem
        enableColorScheme={false}
      >
        {children}
        <Toaster
          richColors
          position="top-right"
          toastOptions={{
            classNames: {
              toast:
                "paper-sheet font-display text-base font-semibold text-[var(--paper-ink)] border-[var(--crayon-stroke)]",
            },
          }}
        />
      </ThemeProvider>
    </AuthSessionProvider>
  );
}
