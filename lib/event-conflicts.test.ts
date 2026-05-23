import { describe, expect, it } from "vitest";
import {
  findConflictingEvents,
  findEventConflictPairs,
  intervalsOverlap,
} from "./event-conflicts";

const userId = "u1";

function ev(
  id: string,
  start: string,
  end: string,
  extra?: Partial<{ createdById: string; participants: { userId: string; status: string }[] }>,
) {
  return {
    id,
    title: id,
    phase: "scheduled" as const,
    start,
    end,
    createdById: extra?.createdById ?? userId,
    participants: extra?.participants ?? [],
  };
}

describe("intervalsOverlap", () => {
  it("detects overlap", () => {
    const a0 = new Date("2026-05-21T10:00:00");
    const a1 = new Date("2026-05-21T12:00:00");
    const b0 = new Date("2026-05-21T11:00:00");
    const b1 = new Date("2026-05-21T13:00:00");
    expect(intervalsOverlap(a0, a1, b0, b1)).toBe(true);
  });

  it("rejects adjacent slots", () => {
    const a0 = new Date("2026-05-21T10:00:00");
    const a1 = new Date("2026-05-21T12:00:00");
    const b0 = new Date("2026-05-21T12:00:00");
    const b1 = new Date("2026-05-21T14:00:00");
    expect(intervalsOverlap(a0, a1, b0, b1)).toBe(false);
  });
});

describe("findConflictingEvents", () => {
  it("returns events the user shares that overlap the range", () => {
    const events = [
      ev("e1", "2026-05-21T09:00:00", "2026-05-21T11:00:00"),
      ev("e2", "2026-05-21T10:30:00", "2026-05-21T12:00:00", {
        createdById: "other",
        participants: [{ userId, status: "accepted" }],
      }),
      ev("e3", "2026-05-21T10:30:00", "2026-05-21T12:00:00", {
        createdById: "other",
        participants: [{ userId, status: "declined" }],
      }),
    ];
    const start = new Date("2026-05-21T10:00:00");
    const end = new Date("2026-05-21T11:30:00");
    const conflicts = findConflictingEvents(events, start, end, userId);
    expect(conflicts.map((c) => c.id).sort()).toEqual(["e1", "e2"]);
  });

  it("excludes the event being edited", () => {
    const events = [ev("e1", "2026-05-21T10:00:00", "2026-05-21T12:00:00")];
    const start = new Date("2026-05-21T10:30:00");
    const end = new Date("2026-05-21T11:30:00");
    expect(
      findConflictingEvents(events, start, end, userId, "e1"),
    ).toHaveLength(0);
  });
});

describe("findEventConflictPairs", () => {
  it("finds pairs among user events", () => {
    const events = [
      ev("a", "2026-05-21T10:00:00", "2026-05-21T12:00:00"),
      ev("b", "2026-05-21T11:00:00", "2026-05-21T13:00:00"),
      ev("c", "2026-05-22T10:00:00", "2026-05-22T12:00:00"),
    ];
    const pairs = findEventConflictPairs(events, userId);
    expect(pairs).toHaveLength(1);
    expect(pairs[0]!.a.id).toBe("a");
    expect(pairs[0]!.b.id).toBe("b");
  });
});
