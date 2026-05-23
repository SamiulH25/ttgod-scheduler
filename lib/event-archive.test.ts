import { describe, expect, it } from "vitest";
import {
  canManuallyArchiveEvent,
  isCompletedScheduledEvent,
} from "./event-archive";

describe("isCompletedScheduledEvent", () => {
  it("returns true when scheduled end is in the past", () => {
    expect(
      isCompletedScheduledEvent({
        phase: "scheduled",
        end: new Date("2020-01-02T12:00:00Z"),
      }),
    ).toBe(true);
  });

  it("returns false for future scheduled events", () => {
    expect(
      isCompletedScheduledEvent({
        phase: "scheduled",
        end: new Date("2099-01-02T12:00:00Z"),
      }),
    ).toBe(false);
  });

  it("returns false for non-scheduled phases", () => {
    expect(
      isCompletedScheduledEvent({
        phase: "interest",
        end: new Date("2020-01-02T12:00:00Z"),
      }),
    ).toBe(false);
  });
});

describe("canManuallyArchiveEvent", () => {
  it("blocks archive for future pinned events", () => {
    expect(
      canManuallyArchiveEvent({
        phase: "scheduled",
        end: new Date("2099-01-02T12:00:00Z"),
      }),
    ).toBe(false);
  });

  it("allows archive after pinned event ends", () => {
    expect(
      canManuallyArchiveEvent({
        phase: "scheduled",
        end: new Date("2020-01-02T12:00:00Z"),
      }),
    ).toBe(true);
  });

  it("allows archive for interest and scheduling phases", () => {
    expect(
      canManuallyArchiveEvent({ phase: "interest", end: null }),
    ).toBe(true);
    expect(
      canManuallyArchiveEvent({ phase: "scheduling", end: null }),
    ).toBe(true);
  });
});
