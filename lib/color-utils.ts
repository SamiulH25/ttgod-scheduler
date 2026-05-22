/** Add alpha to oklch()/rgb() strings for crayon fills */
export function withAlpha(color: string, alpha: number): string {
  const a = Math.min(1, Math.max(0, alpha));
  if (color.includes("/")) {
    return color.replace(/\/\s*[\d.]+\s*\)/, ` / ${a})`);
  }
  if (color.endsWith(")")) {
    return color.replace(/\)$/, ` / ${a})`);
  }
  return color;
}
