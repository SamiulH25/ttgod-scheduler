import { describe, expect, it } from "vitest";
import { startOfDay } from "date-fns";
import { buildDayLayout, type CalendarBlock } from "./calendar";
import { computeCombinedOwnBlock } from "./availability";

const day = startOfDay(new Date("2026-05-21T12:00:00"));

function block(
  id: string,
  userId: string,
  startMin: number,
  endMin: number,
): CalendarBlock {
  const start = new Date(day);
  start.setMinutes(startMin);
  const end = new Date(day);
  end.setMinutes(endMin);
  return {
    id,
    userId,
    start: start.toISOString(),
    end: end.toISOString(),
    label: null,
    user: { id: userId, name: userId, image: null },
  };
}

describe("buildDayLayout", () => {
  it("highlights only the intersecting minutes for two users", () => {
    const layout = buildDayLayout(day, [
      block("a", "user-a", 14 * 60, 16 * 60),
      block("b", "user-b", 15 * 60, 17 * 60),
    ]);

    expect(layout.overlapBands).toHaveLength(1);
    expect(layout.overlapBands[0]!.startMin).toBe(15 * 60);
    expect(layout.overlapBands[0]!.endMin).toBe(16 * 60);
    expect(layout.overlapBands[0]!.userIds.sort()).toEqual(["user-a", "user-b"]);

    const soloA = layout.soloRects.filter((r) => r.block.userId === "user-a");
    const soloB = layout.soloRects.filter((r) => r.block.userId === "user-b");
    expect(soloA).toHaveLength(1);
    expect(soloA[0]!.startMin).toBe(14 * 60);
    expect(soloA[0]!.endMin).toBe(15 * 60);
    expect(soloB).toHaveLength(1);
    expect(soloB[0]!.startMin).toBe(16 * 60);
    expect(soloB[0]!.endMin).toBe(17 * 60);
  });

  it("keeps adjacent same-user blocks as separate solo rects", () => {
    const layout = buildDayLayout(day, [
      block("a1", "user-a", 13 * 60, 14 * 60),
      block("a2", "user-a", 14 * 60, 15 * 60),
    ]);

    expect(layout.overlapBands).toHaveLength(0);
    expect(layout.soloRects).toHaveLength(2);
    expect(layout.soloRects[0]!.block.id).toBe("a1");
    expect(layout.soloRects[1]!.block.id).toBe("a2");
  });

  it("groups three users in one overlap band", () => {
    const layout = buildDayLayout(day, [
      block("a", "user-a", 18 * 60, 20 * 60),
      block("b", "user-b", 18 * 60, 20 * 60),
      block("c", "user-c", 18 * 60, 20 * 60),
    ]);

    expect(layout.overlapBands).toHaveLength(1);
    expect(layout.overlapBands[0]!.userIds.sort()).toEqual([
      "user-a",
      "user-b",
      "user-c",
    ]);
  });
});

describe("computeCombinedOwnBlock", () => {
  it("unions new drag with all overlapping own blocks", () => {
    const existing = [
      {
        id: "1",
        start: new Date("2026-05-21T13:00:00"),
        end: new Date("2026-05-21T15:00:00"),
      },
      {
        id: "2",
        start: new Date("2026-05-21T15:00:00"),
        end: new Date("2026-05-21T17:00:00"),
      },
    ];
    const { overlapping, combinedStart, combinedEnd } = computeCombinedOwnBlock(
      existing,
      new Date("2026-05-21T14:00:00"),
      new Date("2026-05-21T16:00:00"),
    );

    expect(overlapping).toHaveLength(2);
    expect(combinedStart).toEqual(new Date("2026-05-21T13:00:00"));
    expect(combinedEnd).toEqual(new Date("2026-05-21T17:00:00"));
  });

  it("expands when new range sits inside a larger block", () => {
    const existing = [
      {
        id: "1",
        start: new Date("2026-05-21T13:00:00"),
        end: new Date("2026-05-21T17:00:00"),
      },
    ];
    const { overlapping, combinedStart, combinedEnd } = computeCombinedOwnBlock(
      existing,
      new Date("2026-05-21T14:00:00"),
      new Date("2026-05-21T15:00:00"),
    );

    expect(overlapping).toHaveLength(1);
    expect(combinedStart).toEqual(new Date("2026-05-21T13:00:00"));
    expect(combinedEnd).toEqual(new Date("2026-05-21T17:00:00"));
  });

  it("returns no overlapping when range is clear", () => {
    const existing = [
      {
        id: "1",
        start: new Date("2026-05-21T09:00:00"),
        end: new Date("2026-05-21T10:00:00"),
      },
    ];
    const { overlapping, combinedStart, combinedEnd } = computeCombinedOwnBlock(
      existing,
      new Date("2026-05-21T14:00:00"),
      new Date("2026-05-21T16:00:00"),
    );

    expect(overlapping).toHaveLength(0);
    expect(combinedStart).toEqual(new Date("2026-05-21T14:00:00"));
    expect(combinedEnd).toEqual(new Date("2026-05-21T16:00:00"));
  });
});
