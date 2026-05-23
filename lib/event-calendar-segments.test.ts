import { describe, expect, it } from "vitest";
import { getCalendarViewport } from "./calendar";
import { intervalSegmentForDay } from "./event-calendar-segments";

const viewport = getCalendarViewport("full");

describe("intervalSegmentForDay", () => {
  it("splits Fri evening through Sun afternoon across days", () => {
    const fri = new Date("2026-05-22T18:00:00");
    const sun = new Date("2026-05-24T14:00:00");
    const friSeg = intervalSegmentForDay(
      new Date("2026-05-22T12:00:00"),
      fri,
      sun,
      viewport,
      { eventId: "e1", title: "Trip" },
    );
    const satSeg = intervalSegmentForDay(
      new Date("2026-05-23T12:00:00"),
      fri,
      sun,
      viewport,
      { eventId: "e1", title: "Trip" },
    );
    const sunSeg = intervalSegmentForDay(
      new Date("2026-05-24T12:00:00"),
      fri,
      sun,
      viewport,
      { eventId: "e1", title: "Trip" },
    );

    expect(friSeg?.position).toBe("start");
    expect(friSeg?.startMin).toBe(18 * 60);
    expect(satSeg?.position).toBe("middle");
    expect(sunSeg?.position).toBe("end");
    expect(sunSeg?.endMin).toBe(14 * 60);
  });

  it("returns single for same-day range", () => {
    const start = new Date("2026-05-22T10:00:00");
    const end = new Date("2026-05-22T14:00:00");
    const seg = intervalSegmentForDay(
      new Date("2026-05-22T12:00:00"),
      start,
      end,
      viewport,
      { eventId: "e1", title: "Slot" },
    );
    expect(seg?.position).toBe("single");
    expect(seg?.startMin).toBe(10 * 60);
    expect(seg?.endMin).toBe(14 * 60);
  });
});
