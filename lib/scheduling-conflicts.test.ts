import { describe, expect, it } from "vitest";
import { findBusyTentativeOverlappingProposal } from "@/lib/scheduling-conflicts";

describe("findBusyTentativeOverlappingProposal", () => {
  const w0 = new Date("2026-05-22T18:00:00.000Z");
  const w1 = new Date("2026-05-22T20:00:00.000Z");

  it("returns users with busy overlapping", () => {
    const r = findBusyTentativeOverlappingProposal(w0, w1, [
      {
        userId: "a",
        start: new Date("2026-05-22T19:00:00.000Z"),
        end: new Date("2026-05-22T21:00:00.000Z"),
        status: "busy",
      },
      {
        userId: "b",
        start: new Date("2026-05-22T12:00:00.000Z"),
        end: new Date("2026-05-22T13:00:00.000Z"),
        status: "busy",
      },
    ]);
    expect(r).toEqual([{ userId: "a", status: "busy" }]);
  });

  it("includes tentative", () => {
    const r = findBusyTentativeOverlappingProposal(w0, w1, [
      {
        userId: "x",
        start: new Date("2026-05-22T17:00:00.000Z"),
        end: new Date("2026-05-22T19:30:00.000Z"),
        status: "tentative",
      },
    ]);
    expect(r).toEqual([{ userId: "x", status: "tentative" }]);
  });

  it("ignores free", () => {
    const r = findBusyTentativeOverlappingProposal(w0, w1, [
      {
        userId: "z",
        start: new Date("2026-05-22T18:00:00.000Z"),
        end: new Date("2026-05-22T20:00:00.000Z"),
        status: "free",
      },
    ]);
    expect(r).toEqual([]);
  });
});
