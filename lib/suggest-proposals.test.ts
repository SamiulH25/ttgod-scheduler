import { describe, expect, it } from "vitest";
import { intersectAll, suggestProposalSlots } from "./suggest-proposals";

describe("intersectAll", () => {
  it("returns common overlap", () => {
    const a = new Date("2026-05-22T18:00:00.000Z");
    const c = new Date("2026-05-22T18:30:00.000Z");
    const d = new Date("2026-05-22T20:00:00.000Z");
    const r = intersectAll([
      { start: a, end: d },
      { start: c, end: d },
    ]);
    expect(r!.start.toISOString()).toBe(c.toISOString());
    expect(r!.end.toISOString()).toBe(d.toISOString());
  });

  it("returns null when disjoint", () => {
    const r = intersectAll([
      { start: new Date("2026-05-22T10:00:00.000Z"), end: new Date("2026-05-22T11:00:00.000Z") },
      { start: new Date("2026-05-22T12:00:00.000Z"), end: new Date("2026-05-22T13:00:00.000Z") },
    ]);
    expect(r).toBeNull();
  });
});

describe("suggestProposalSlots", () => {
  it("finds a slot shared by all users", () => {
    const rangeStart = new Date("2026-05-22T00:00:00.000Z");
    const rangeEnd = new Date("2026-05-23T00:00:00.000Z");
    const slices = [
      {
        userId: "u1",
        start: new Date("2026-05-22T17:00:00.000Z"),
        end: new Date("2026-05-22T21:00:00.000Z"),
        status: "free",
      },
      {
        userId: "u2",
        start: new Date("2026-05-22T18:00:00.000Z"),
        end: new Date("2026-05-22T22:00:00.000Z"),
        status: "free",
      },
    ];
    const slots = suggestProposalSlots(["u1", "u2"], slices, rangeStart, rangeEnd, 60);
    expect(slots.length).toBeGreaterThan(0);
    const first = slots[0]!;
    expect(first.end.getTime() - first.start.getTime()).toBe(60 * 60 * 1000);
  });

  it("returns empty when a user has no availability", () => {
    const slots = suggestProposalSlots(
      ["u1", "u2"],
      [
        {
          userId: "u1",
          start: new Date("2026-05-22T17:00:00.000Z"),
          end: new Date("2026-05-22T21:00:00.000Z"),
          status: "free",
        },
      ],
      new Date("2026-05-22T00:00:00.000Z"),
      new Date("2026-05-23T00:00:00.000Z"),
      60,
    );
    expect(slots).toEqual([]);
  });
});
