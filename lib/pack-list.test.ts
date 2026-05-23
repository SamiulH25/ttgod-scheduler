import { describe, expect, it } from "vitest";
import { rollupPackListFromPlanItems } from "@/lib/pack-list";

describe("rollupPackListFromPlanItems", () => {
  it("merges undone checklist labels across items", () => {
    const lines = rollupPackListFromPlanItems([
      {
        kind: "step",
        title: "A",
        checklist: JSON.stringify([
          { label: "Water", done: false },
          { label: "Snacks", done: true },
        ]),
      },
      {
        kind: "ride",
        title: "Drive",
        checklist: JSON.stringify([{ label: "water", done: false }]),
      },
    ]);
    expect(lines).toEqual(["Water"]);
  });
});
