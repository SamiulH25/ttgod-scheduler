import { describe, expect, it } from "vitest";
import { canAddParticipant, countTowardCap, isAtCapacity } from "./campaign-capacity";

describe("campaign-capacity", () => {
  it("counts interested during interest phase", () => {
    const participants = [
      { status: "interested" },
      { status: "interested" },
      { status: "not_interested" },
    ];
    expect(countTowardCap("interest", participants)).toBe(2);
  });

  it("counts accepted when scheduled", () => {
    const participants = [
      { status: "accepted" },
      { status: "pending" },
      { status: "interested" },
    ];
    expect(countTowardCap("scheduled", participants)).toBe(1);
  });

  it("enforces max capacity", () => {
    const participants = [{ status: "interested" }, { status: "interested" }];
    expect(isAtCapacity("interest", participants, 2)).toBe(true);
    expect(canAddParticipant("interest", participants, 2)).toBe(false);
  });
});
