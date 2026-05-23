import { describe, expect, it } from "vitest";
import { serializeEventDetail } from "./serialize-event-detail";

describe("serializeEventDetail", () => {
  it("converts event and proposal dates to ISO strings", () => {
    const start = new Date("2026-06-01T18:00:00.000Z");
    const end = new Date("2026-06-01T20:00:00.000Z");
    const serialized = serializeEventDetail({
      id: "ev1",
      phase: "scheduled",
      start,
      end,
      proposals: [
        {
          id: "p1",
          start: new Date("2026-06-01T18:00:00.000Z"),
          end: new Date("2026-06-01T20:00:00.000Z"),
        },
      ],
      images: [{ id: "img1", url: "/uploads/a.png" }],
    });

    expect(serialized.start).toBe(start.toISOString());
    expect(serialized.end).toBe(end.toISOString());
    expect(serialized.proposals[0]?.start).toBe(start.toISOString());
    expect(serialized.proposals[0]?.end).toBe(end.toISOString());
    expect(serialized.images[0]?.url).toBe("/uploads/a.png");
  });
});
