import { describe, expect, it } from "vitest";
import { addDays, addHours } from "date-fns";
import { findRankedSlots, findFullRosterSlots } from "@/lib/scheduling/find-slots";
import type { AvailabilitySlice } from "@/lib/suggest-proposals";

function slice(
  userId: string,
  start: Date,
  hours: number,
  status = "free",
): AvailabilitySlice {
  return {
    userId,
    start,
    end: addHours(start, hours),
    status,
  };
}

describe("findRankedSlots", () => {
  const rangeStart = new Date("2026-06-01T00:00:00");
  const rangeEnd = addDays(rangeStart, 7);

  it("returns empty when no users", () => {
    expect(
      findRankedSlots([], [], rangeStart, rangeEnd, 60),
    ).toEqual([]);
  });

  it("ranks higher overlap before lower", () => {
    const t = new Date("2026-06-03T18:00:00");
    const slices: AvailabilitySlice[] = [
      slice("a", t, 4),
      slice("b", t, 4),
      slice("c", addHours(t, 2), 2),
    ];
    const ranked = findRankedSlots(
      ["a", "b", "c"],
      slices,
      rangeStart,
      rangeEnd,
      120,
      { minOverlapCount: 2, limit: 20 },
    );
    expect(ranked.length).toBeGreaterThan(0);
    const best = ranked[0]!;
    expect(best.overlapCount).toBeGreaterThanOrEqual(2);
    expect(best.reasons.some((r) => r.includes("free"))).toBe(true);
  });

  it("full roster requires everyone", () => {
    const t = new Date("2026-06-04T14:00:00");
    const slices: AvailabilitySlice[] = [
      slice("a", t, 3),
      slice("b", t, 3),
    ];
    const full = findFullRosterSlots(
      ["a", "b"],
      slices,
      rangeStart,
      rangeEnd,
      60,
    );
    expect(full.length).toBeGreaterThan(0);
    expect(full[0]!.overlapCount).toBe(2);
    expect(full[0]!.reasons).toContain("Whole squad available");
  });
});
