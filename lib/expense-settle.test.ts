import { describe, expect, it } from "vitest";
import { settleEvenCents, settleWeightedCents } from "@/lib/expense-settle";

describe("settleEvenCents", () => {
  it("splits remainder to first slots", () => {
    expect(settleEvenCents(100, 3)).toEqual([34, 33, 33]);
  });

  it("handles zero", () => {
    expect(settleEvenCents(0, 4)).toEqual([0, 0, 0, 0]);
  });

  it("handles single payer", () => {
    expect(settleEvenCents(99, 1)).toEqual([99]);
  });
});

describe("settleWeightedCents", () => {
  it("splits by weights with largest remainder", () => {
    expect(settleWeightedCents(100, [1, 1, 1])).toEqual([34, 33, 33]);
    expect(settleWeightedCents(100, [3, 1])).toEqual([75, 25]);
    expect(settleWeightedCents(10, [2, 1, 1])).toEqual([5, 3, 2]);
  });

  it("returns zeros when weights sum to zero", () => {
    expect(settleWeightedCents(50, [0, 0])).toEqual([0, 0]);
  });
});