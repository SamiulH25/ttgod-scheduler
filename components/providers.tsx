"use client";

import { AuthSessionProvider } from "@/components/session-provider";
import { APP_THEMES } from "@/lib/themes";
import { ThemeProvider } from "next-themes";
import { PlayfulToaster } from "@/components/motion/playful-toaster";

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
        <PlayfulToaster />
      </ThemeProvider>
    </AuthSessionProvider>
  );
}
