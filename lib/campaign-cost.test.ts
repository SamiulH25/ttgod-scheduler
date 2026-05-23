import { describe, expect, it } from "vitest";
import {
  formatCostLine,
  formatCostLineFromExpenses,
  perPersonShareCents,
  sumExpenseCents,
} from "./campaign-cost";

describe("campaign-cost", () => {
  it("sums expense rows", () => {
    expect(
      sumExpenseCents([
        { amountCents: 1000 },
        { amountCents: 2500 },
      ]),
    ).toBe(3500);
  });

  it("splits evenly across payers", () => {
    expect(perPersonShareCents(10000, true, 4)).toBe(2500);
  });

  it("returns null when not splitting", () => {
    expect(perPersonShareCents(10000, false, 4)).toBeNull();
  });

  it("formats total and per-person line", () => {
    const line = formatCostLine(4000, "USD", true, 4);
    expect(line).toContain("total");
    expect(line).toContain("each");
  });

  it("formats from expense rows", () => {
    const line = formatCostLineFromExpenses(
      [
        { amountCents: 5000 },
        { amountCents: 3000 },
      ],
      "USD",
      true,
      2,
    );
    expect(line).toContain("$80");
    expect(line).toContain("each");
  });
});
