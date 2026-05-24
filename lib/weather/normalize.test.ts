import { describe, expect, it } from "vitest";
import { normalizeForecast } from "@/lib/weather/normalize";

const sample = {
  daily: {
    time: ["2026-05-20", "2026-05-21"],
    weather_code: [0, 61],
    temperature_2m_max: [22, 18],
    temperature_2m_min: [12, 10],
  },
  hourly: {
    time: ["2026-05-20T08:00", "2026-05-20T14:00"],
    temperature_2m: [14, 20],
    weather_code: [0, 3],
    precipitation_probability: [5, 20],
  },
};

describe("normalizeForecast", () => {
  it("builds days and hoursByDate", () => {
    const week = normalizeForecast(sample, "Portland, US");
    expect(week.locationLabel).toBe("Portland, US");
    expect(week.days).toHaveLength(2);
    expect(week.days[0]!.highC).toBe(22);
    expect(week.hoursByDate["2026-05-20"]).toHaveLength(2);
    expect(week.hoursByDate["2026-05-20"]![1]!.precipChance).toBe(20);
  });
});
