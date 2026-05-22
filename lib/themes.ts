export const APP_THEMES = [
  "light",
  "dark",
  "system",
  "bob2142",
  "voicedrew",
  "crainingaming",
] as const;

export type AppTheme = (typeof APP_THEMES)[number];

export type ThemeOption = {
  id: AppTheme;
  label: string;
  description: string;
  group: "classic" | "squad";
  swatches: string[];
};

export const THEME_OPTIONS: ThemeOption[] = [
  {
    id: "light",
    label: "Light",
    description: "Bright plaster wall and cream paper",
    group: "classic",
    swatches: [
      "oklch(0.93 0.012 85)",
      "oklch(0.98 0.02 95)",
      "oklch(0.55 0.18 25)",
      "oklch(0.52 0.14 250)",
    ],
  },
  {
    id: "dark",
    label: "Dark",
    description: "Dim wall with warm paper notes",
    group: "classic",
    swatches: [
      "oklch(0.42 0.02 75)",
      "oklch(0.88 0.025 90)",
      "oklch(0.62 0.16 25)",
      "oklch(0.58 0.12 250)",
    ],
  },
  {
    id: "system",
    label: "System",
    description: "Match your device light or dark mode",
    group: "classic",
    swatches: [
      "oklch(0.75 0.02 85)",
      "oklch(0.5 0.02 75)",
      "oklch(0.55 0.12 250)",
      "oklch(0.45 0.02 50)",
    ],
  },
  {
    id: "bob2142",
    label: "BOB2142",
    description: "Cool concrete and steel-blue crayon",
    group: "squad",
    swatches: [
      "oklch(0.38 0.02 250)",
      "oklch(0.9 0.015 250)",
      "oklch(0.52 0.14 250)",
      "oklch(0.68 0.12 85)",
    ],
  },
  {
    id: "voicedrew",
    label: "Voicedrew",
    description: "Violet lounge with coral and lavender",
    group: "squad",
    swatches: [
      "oklch(0.36 0.06 310)",
      "oklch(0.92 0.03 95)",
      "oklch(0.58 0.16 15)",
      "oklch(0.55 0.14 300)",
    ],
  },
  {
    id: "crainingaming",
    label: "Crainingaming",
    description: "Stormy blue board with cyan highlights",
    group: "squad",
    swatches: [
      "oklch(0.34 0.04 240)",
      "oklch(0.9 0.02 230)",
      "oklch(0.55 0.14 240)",
      "oklch(0.62 0.14 195)",
    ],
  },
];
