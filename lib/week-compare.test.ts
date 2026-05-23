import { describe, expect, it } from "vitest";
import { addDays } from "date-fns";
import { compareWeeksAvailability } from "@/lib/week-compare";

describe("compareWeeksAvailability", () => {
  it("compares free minutes per user across two weeks", () => {
    const aStart = new Date("2026-05-18T00:00:00.000Z");
    const bStart = addDays(aStart, 7);
    const r = compareWeeksAvailability({
      weekAStart: aStart,
      weekBStart: bStart,
      userIds: ["u1"],
      blocks: [
        {
          userId: "u1",
          start: new Date("2026-05-19T10:00:00.000Z"),
          end: new Date("2026-05-19T12:00:00.000Z"),
          status: "free",
        },
        {
          userId: "u1",
          start: addDays(new Date("2026-05-19T10:00:00.000Z"), 7),
          end: addDays(new Date("2026-05-19T14:00:00.000Z"), 7),
          status: "free",
        },
      ],
    });
    expect(r.perUser[0]!.freeMinutesA).toBe(120);
    expect(r.perUser[0]!.freeMinutesB).toBe(240);
    expect(r.perUser[0]!.deltaMinutes).toBe(120);
  });
});
