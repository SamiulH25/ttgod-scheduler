export const APP_FONTS = ["caveat", "patrick", "kalam", "comic"] as const;

export type AppFont = (typeof APP_FONTS)[number];

export type FontOption = {
  id: AppFont;
  label: string;
  description: string;
  cssVar: string;
  previewClass: string;
};

export const FONT_OPTIONS: FontOption[] = [
  {
    id: "caveat",
    label: "Caveat",
    description: "Loose scribble — default squad board hand",
    cssVar: "var(--font-caveat)",
    previewClass: "font-caveat",
  },
  {
    id: "patrick",
    label: "Patrick Hand",
    description: "Rounded casual print",
    cssVar: "var(--font-patrick)",
    previewClass: "font-patrick",
  },
  {
    id: "kalam",
    label: "Kalam",
    description: "Neat marker handwriting",
    cssVar: "var(--font-kalam)",
    previewClass: "font-kalam",
  },
  {
    id: "comic",
    label: "Comic Sans",
    description: "Classic comic book — Comic Neue fallback on the web",
    cssVar: "var(--font-comic-neue)",
    previewClass: "font-comic",
  },
];

export function fontFamilyFor(id: AppFont): string {
  const opt = FONT_OPTIONS.find((f) => f.id === id) ?? FONT_OPTIONS[0];
  if (opt.id === "comic") {
    return '"Comic Sans MS", "Comic Sans", var(--font-comic-neue), cursive';
  }
  const fallback = opt.id === "kalam" ? "sans-serif" : "cursive";
  return `${opt.cssVar}, "Segoe Print", ${fallback}`;
}
