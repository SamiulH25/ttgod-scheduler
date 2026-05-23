import { describe, expect, it } from "vitest";
import { addDays, startOfWeek } from "date-fns";
import { buildAgendaItemsForDay, countBlocksOnDay } from "@/lib/agenda-items";
import type { CalendarBlock } from "@/lib/calendar";

function block(
  id: string,
  userId: string,
  start: Date,
  end: Date,
): CalendarBlock {
  return {
    id,
    userId,
    start: start.toISOString(),
    end: end.toISOString(),
    label: null,
    user: { id: userId, name: `User ${userId}`, image: null },
  };
}

describe("agenda-items", () => {
  const monday = startOfWeek(new Date("2026-05-18"), { weekStartsOn: 1 });

  it("counts blocks touching a day", () => {
    const blocks = [
      block("1", "a", monday, addDays(monday, 1)),
      block("2", "b", addDays(monday, 2), addDays(monday, 3)),
    ];
    expect(countBlocksOnDay(monday, blocks)).toBe(1);
    expect(countBlocksOnDay(addDays(monday, 2), blocks)).toBe(1);
  });

  it("sorts agenda items by start time", () => {
    const day = addDays(monday, 1);
    const morning = new Date(day);
    morning.setHours(9, 0, 0, 0);
    const afternoon = new Date(day);
    afternoon.setHours(14, 0, 0, 0);
    const blocks = [
      block("late", "a", afternoon, new Date(day.setHours(16, 0, 0, 0))),
      block("early", "b", morning, new Date(morning.getTime() + 2 * 60 * 60 * 1000)),
    ];
    const items = buildAgendaItemsForDay(addDays(monday, 1), blocks);
    expect(items.length).toBeGreaterThan(0);
    for (let i = 1; i < items.length; i++) {
      expect(items[i]!.start.getTime()).toBeGreaterThanOrEqual(
        items[i - 1]!.start.getTime(),
      );
    }
  });
});
