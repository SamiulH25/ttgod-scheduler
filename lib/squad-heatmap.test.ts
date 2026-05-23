import { describe, expect, it } from "vitest";
import { addHours, startOfWeek } from "date-fns";
import { buildSquadHeatmap } from "@/lib/squad-heatmap";

describe("buildSquadHeatmap", () => {
  it("counts free users per hour cell", () => {
    const weekStart = startOfWeek(new Date("2026-05-18T12:00:00.000Z"), {
      weekStartsOn: 1,
    });
    const day0 = weekStart;
    const h18 = addHours(day0, 18);
    const h20 = addHours(day0, 20);
    const cells = buildSquadHeatmap(weekStart, [
      {
        userId: "u1",
        start: h18,
        end: h20,
        status: "free",
      },
      {
        userId: "u2",
        start: h18,
        end: addHours(day0, 19),
        status: "free",
      },
      {
        userId: "u3",
        start: h18,
        end: h20,
        status: "busy",
      },
    ]);
    const cell18 = cells.find((c) => c.dayIndex === 0 && c.hour === 18);
    expect(cell18?.count).toBe(2);
  });
});
