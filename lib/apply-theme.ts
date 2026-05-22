import type { AppTheme } from "@/lib/themes";

const SQUAD_THEMES = new Set(["bob2142", "voicedrew", "crainingaming"]);

/** Value for html[data-theme] — never "system" (resolved to light/dark). */
export function resolveThemeAttribute(theme: string): string {
  if (theme === "system") {
    if (typeof window === "undefined") return "light";
    return window.matchMedia("(prefers-color-scheme: dark)").matches
      ? "dark"
      : "light";
  }
  return theme;
}

const THEME_STORAGE_KEY = "ttgod-theme";

/** Keep next-themes' blocking script aligned with the saved preference. */
export function persistThemePreference(theme: string): void {
  if (typeof localStorage === "undefined") return;
  try {
    localStorage.setItem(THEME_STORAGE_KEY, theme);
    localStorage.removeItem("theme");
  } catch {
    /* private mode / quota */
  }
}

export function applyThemeToDocument(theme: string): void {
  if (typeof document === "undefined") return;
  const resolved = resolveThemeAttribute(theme);
  const root = document.documentElement;
  root.setAttribute("data-theme", resolved);
  if (SQUAD_THEMES.has(resolved) || resolved === "dark") {
    root.style.colorScheme = "dark";
  } else {
    root.style.colorScheme = "light";
  }
  persistThemePreference(theme);
}

export function isAppTheme(value: string): value is AppTheme {
  return (
    value === "light" ||
    value === "dark" ||
    value === "system" ||
    value === "bob2142" ||
    value === "voicedrew" ||
    value === "crainingaming"
  );
}
