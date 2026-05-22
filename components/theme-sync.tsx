"use client";

import { applyThemeToDocument } from "@/lib/apply-theme";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

export function ThemeSync({ theme }: { theme: string }) {
  const { setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Sync server preference after mount and when the server prop changes.
  // `setTheme` is intentionally omitted: next-themes recreates it when theme state
  // updates, which re-ran this effect and reset previews to the saved profile theme.
  useEffect(() => {
    if (!mounted || !theme) return;
    setTheme(theme);
    applyThemeToDocument(theme);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- see comment above
  }, [theme, mounted]);

  useEffect(() => {
    if (!mounted || theme !== "system") return;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => applyThemeToDocument("system");
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, [theme, mounted]);

  return null;
}
