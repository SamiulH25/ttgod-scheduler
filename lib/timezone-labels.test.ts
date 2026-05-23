import { describe, expect, it } from "vitest";
import { formatTimezoneLabel, formatTimezoneOffsetLabel } from "./timezone-labels";

describe("timezone-labels", () => {
  it("returns offset-style name for a known zone", () => {
    const instant = new Date("2026-01-15T12:00:00.000Z");
    const label = formatTimezoneOffsetLabel("America/New_York", instant);
    expect(label).toMatch(/GMT[+-]/);
  });

  it("formatTimezoneLabel includes zone id", () => {
    const instant = new Date("2026-06-15T12:00:00.000Z");
    const full = formatTimezoneLabel("Europe/London", instant);
    expect(full).toContain("Europe/London");
  });

  it("falls back to raw id on invalid zone", () => {
    expect(formatTimezoneOffsetLabel("Not/AZone")).toBe("Not/AZone");
  });
});
