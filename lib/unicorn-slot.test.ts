import { describe, expect, it } from "vitest";
import { isUnicornOverlap } from "@/lib/unicorn-slot";

describe("isUnicornOverlap", () => {
  it("is true when overlap count matches everyone who posted blocks", () => {
    expect(
      isUnicornOverlap({ count: 4, userIds: ["a", "b", "c", "d"] }, 4),
    ).toBe(true);
  });

  it("is false when someone is missing from the overlap", () => {
    expect(isUnicornOverlap({ count: 2, userIds: ["a", "b"] }, 4)).toBe(false);
  });

  it("is false for solo availability baseline", () => {
    expect(isUnicornOverlap({ count: 1, userIds: ["a"] }, 1)).toBe(false);
  });
});
