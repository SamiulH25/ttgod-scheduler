/** Classic sticky-note pastels for the events bulletin board */
export const STICKY_NOTE_COLORS = [
  { bg: "oklch(0.94 0.14 95)", ink: "oklch(0.32 0.04 50)" },
  { bg: "oklch(0.9 0.12 350)", ink: "oklch(0.32 0.05 340)" },
  { bg: "oklch(0.88 0.1 230)", ink: "oklch(0.28 0.06 250)" },
  { bg: "oklch(0.9 0.11 145)", ink: "oklch(0.28 0.05 150)" },
  { bg: "oklch(0.92 0.12 65)", ink: "oklch(0.32 0.05 50)" },
  { bg: "oklch(0.91 0.1 200)", ink: "oklch(0.3 0.05 250)" },
] as const;

export function stickyColorForId(id: string): (typeof STICKY_NOTE_COLORS)[number] {
  let h = 0;
  for (let i = 0; i < id.length; i++) {
    h = (h * 31 + id.charCodeAt(i)) >>> 0;
  }
  return STICKY_NOTE_COLORS[h % STICKY_NOTE_COLORS.length]!;
}
