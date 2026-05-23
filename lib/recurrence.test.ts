import { describe, expect, it } from "vitest";
import {
  expandWeeklyOccurrencesInRange,
  parseRecurrenceRule,
  shiftBlockToWeek,
} from "./recurrence";

describe("parseRecurrenceRule", () => {
  it("parses valid weekly rule", () => {
    expect(
      parseRecurrenceRule(JSON.stringify({ type: "weekly", interval: 2, weekdays: [1, 3] })),
    ).toEqual({ type: "weekly", interval: 2, weekdays: [1, 3] });
  });

  it("defaults interval and weekdays from anchor when omitted", () => {
    expect(parseRecurrenceRule(JSON.stringify({ type: "weekly" }))).toEqual({
      type: "weekly",
      interval: 1,
      weekdays: undefined,
    });
  });

  it("returns null for invalid json", () => {
    expect(parseRecurrenceRule("{")).toBeNull();
    expect(parseRecurrenceRule(null)).toBeNull();
    expect(parseRecurrenceRule(JSON.stringify({ type: "daily" }))).toBeNull();
  });
});

describe("expandWeeklyOccurrencesInRange", () => {
  it("returns single slice without recurrenceRule", () => {
    const start = new Date("2026-05-22T18:00:00.000Z");
    const end = new Date("2026-05-22T20:00:00.000Z");
    const from = new Date("2026-05-22T00:00:00.000Z");
    const to = new Date("2026-05-23T00:00:00.000Z");
    const occ = expandWeeklyOccurrencesInRange(
      { start, end, recurrenceRule: null, seriesId: "s1" },
      from,
      to,
    );
    expect(occ).toHaveLength(1);
    expect(occ[0]!.seriesId).toBe("s1");
    expect(occ[0]!.start.toISOString()).toBe(start.toISOString());
  });

  it("expands weekly weekdays in range", () => {
    const rule = JSON.stringify({ type: "weekly", weekdays: [5] }); // Friday UTC
    const start = new Date("2026-05-22T18:00:00.000Z"); // Friday
    const end = new Date("2026-05-22T20:00:00.000Z");
    const from = new Date("2026-05-15T00:00:00.000Z");
    const to = new Date("2026-06-05T23:59:59.000Z");
    const occ = expandWeeklyOccurrencesInRange(
      { start, end, recurrenceRule: rule, seriesId: "abc" },
      from,
      to,
    );
    const fridays = occ.filter((o) => o.start.getUTCDay() === 5);
    expect(fridays.length).toBeGreaterThanOrEqual(2);
    expect(fridays.every((o) => o.seriesId === "abc")).toBe(true);
  });
});

describe("shiftBlockToWeek", () => {
  it("moves a block between ISO week starts (Monday)", () => {
    const sourceWeek = new Date("2026-05-18T00:00:00.000Z"); // Mon
    const targetWeek = new Date("2026-05-25T00:00:00.000Z");
    const start = new Date("2026-05-20T15:00:00.000Z");
    const end = new Date("2026-05-20T16:00:00.000Z");
    const shifted = shiftBlockToWeek(start, end, sourceWeek, targetWeek);
    expect(shifted.start.getUTCDay()).toBe(start.getUTCDay());
    expect(shifted.end.getTime() - shifted.start.getTime()).toBe(
      end.getTime() - start.getTime(),
    );
  });
});
