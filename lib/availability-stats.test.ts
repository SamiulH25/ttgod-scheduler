import { describe, expect, it } from "vitest";
import {
  buildSquadRoster,
  countMyBlocks,
  countWeekOverlapBands,
} from "@/lib/availability-stats";
import { getWeekDays, getWeekStart, type CalendarBlock } from "@/lib/calendar";

function block(
  id: string,
  userId: string,
  name: string,
): CalendarBlock {
  return {
    id,
    start: "2026-05-22T18:00:00.000Z",
    end: "2026-05-22T20:00:00.000Z",
    label: null,
    userId,
    user: { id: userId, name, image: null },
  };
}

describe("availability-stats", () => {
  it("buildSquadRoster sorts current user first and counts blocks", () => {
    const rows = buildSquadRoster(
      [block("1", "u1", "Alex"), block("2", "u2", "Sam"), block("3", "u2", "Sam")],
      "u2",
    );
    expect(rows[0].userId).toBe("u2");
    expect(rows.find((r) => r.userId === "u2")?.blockCount).toBe(2);
  });

  it("countMyBlocks filters by user", () => {
    const blocks = [block("1", "u1", "A"), block("2", "u2", "B")];
    expect(countMyBlocks(blocks, "u1")).toBe(1);
  });

  it("countWeekOverlapBands sums layout overlap bands", () => {
    const week = getWeekStart(new Date("2026-05-19"));
    const days = getWeekDays(week);
    const sameSlot = [
      block("1", "u1", "A"),
      {
        ...block("2", "u2", "B"),
        start: "2026-05-22T18:00:00.000Z",
        end: "2026-05-22T20:00:00.000Z",
      },
    ];
    expect(countWeekOverlapBands(sameSlot, days)).toBeGreaterThan(0);
  });
});
