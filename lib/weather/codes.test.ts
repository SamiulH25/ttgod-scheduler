import { describe, expect, it } from "vitest";
import { weatherCodeMeta } from "@/lib/weather/codes";

describe("weatherCodeMeta", () => {
  it("maps clear and rain codes", () => {
    expect(weatherCodeMeta(0).icon).toBe("clear");
    expect(weatherCodeMeta(61).icon).toBe("rain");
    expect(weatherCodeMeta(95).icon).toBe("thunderstorm");
  });
});
