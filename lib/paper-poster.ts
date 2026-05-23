/** Layout tokens for share posters (OG / SVG). */
export const POSTER = {
  width: 1200,
  height: 630,
  bg: "#f5f0e6",
  ink: "#2c2416",
  accent: "#c45c3e",
  overlap: "#7cb87c",
  fontDisplay: "Georgia, serif",
  fontSans: "system-ui, sans-serif",
} as const;

export function formatPosterTitle(count: number, start: Date, end: Date): string {
  const hours = Math.round((end.getTime() - start.getTime()) / 3600000);
  return `${count} squad free · ${hours}h window`;
}
