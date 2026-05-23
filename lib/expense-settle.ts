/**
 * Split `totalCents` evenly across `count` people using integer cents
 * (largest remainder so the sum always matches).
 */
export function settleEvenCents(totalCents: number, count: number): number[] {
  if (count <= 0) return [];
  if (totalCents <= 0) return Array.from({ length: count }, () => 0);
  const base = Math.floor(totalCents / count);
  const remainder = totalCents % count;
  return Array.from({ length: count }, (_, i) => base + (i < remainder ? 1 : 0));
}

/**
 * Split `totalCents` across buckets by non-negative integer weights
 * (largest remainder so the sum always matches `totalCents`).
 */
export function settleWeightedCents(
  totalCents: number,
  weights: number[],
): number[] {
  if (weights.length === 0) return [];
  if (totalCents <= 0) return weights.map(() => 0);

  const safe = weights.map((w) => (Number.isFinite(w) && w > 0 ? w : 0));
  const sumW = safe.reduce((a, b) => a + b, 0);
  if (sumW <= 0) return weights.map(() => 0);

  const exact = safe.map((w) => (totalCents * w) / sumW);
  const floors = exact.map((x) => Math.floor(x));
  const remainder = totalCents - floors.reduce((a, b) => a + b, 0);
  const order = exact
    .map((x, i) => ({ i, frac: x - floors[i]! }))
    .sort((a, b) => b.frac - a.frac);
  const out = [...floors];
  for (let k = 0; k < remainder; k++) {
    const target = order[k % order.length]!;
    out[target.i]! += 1;
  }
  return out;
}

export function formatCents(cents: number, currency: string): string {
  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency: currency.length === 3 ? currency : "USD",
    minimumFractionDigits: 2,
  }).format(cents / 100);
}
