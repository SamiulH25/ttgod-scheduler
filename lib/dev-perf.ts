/** Dev-only navigation / transition timing helpers */

export function isDevPerfEnabled(): boolean {
  return process.env.NODE_ENV === "development";
}

export function perfMark(name: string): void {
  if (typeof performance === "undefined" || !isDevPerfEnabled()) return;
  performance.mark(name);
}

export function perfMeasure(name: string, start: string, end: string): void {
  if (typeof performance === "undefined" || !isDevPerfEnabled()) return;
  try {
    performance.measure(name, start, end);
    const entry = performance.getEntriesByName(name).at(-1);
    if (entry) {
      console.debug(`[perf] ${name}: ${entry.duration.toFixed(1)}ms`);
    }
  } catch {
    // ignore missing marks
  }
}
