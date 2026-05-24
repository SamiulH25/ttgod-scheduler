import { describe, expect, it } from "vitest";
import {
  canadianHolidaysByDateKey,
  getCanadianHolidaysForRange,
} from "@/lib/holidays/canada";

describe("getCanadianHolidaysForRange", () => {
  it("includes Victoria Day 2026", () => {
    const holidays = getCanadianHolidaysForRange(
      new Date(2026, 4, 1),
      new Date(2026, 4, 31),
    );
    const victoria = holidays.find((h) => h.dateKey === "2026-05-18");
    expect(victoria).toBeDefined();
    expect(victoria?.name.toLowerCase()).toContain("victoria");
  });

  it("includes Christmas", () => {
    const map = canadianHolidaysByDateKey(
      new Date(2026, 11, 1),
      new Date(2026, 11, 31),
    );
    expect(map["2026-12-25"]).toBeDefined();
  });

  it("returns no holiday for ordinary weekday", () => {
    const map = canadianHolidaysByDateKey(
      new Date(2026, 4, 20),
      new Date(2026, 4, 20),
    );
    expect(map["2026-05-20"]).toBeUndefined();
  });
});
