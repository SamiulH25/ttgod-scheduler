import { describe, expect, it } from "vitest";
import { weatherForHour } from "@/lib/weather/hour-slot";
import type { HourWeather } from "@/lib/weather/types";

const hours: HourWeather[] = [
  {
    time: "2026-05-23T14:00",
    tempC: 22,
    code: 0,
    icon: "clear",
    label: "Clear",
    precipChance: 5,
  },
  {
    time: "2026-05-23T15:00",
    tempC: 21,
    code: 61,
    icon: "rain",
    label: "Rain",
    precipChance: 80,
  },
];

describe("weatherForHour", () => {
  it("returns matching hour row", () => {
    const row = weatherForHour(hours, "2026-05-23", 15);
    expect(row?.icon).toBe("rain");
    expect(row?.label).toBe("Rain");
  });

  it("returns undefined when no match", () => {
    expect(weatherForHour(hours, "2026-05-23", 10)).toBeUndefined();
    expect(weatherForHour(hours, "2026-05-24", 15)).toBeUndefined();
  });

  it("returns undefined for empty input", () => {
    expect(weatherForHour(undefined, "2026-05-23", 12)).toBeUndefined();
    expect(weatherForHour([], "2026-05-23", 12)).toBeUndefined();
  });
});
