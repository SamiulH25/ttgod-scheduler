import type { WeekWeather } from "@/lib/weather/types";

/** Max hourly precip % per calendar day for slot deprioritization. */
export function precipByDateFromWeek(weather: WeekWeather): Record<string, number> {
  const out: Record<string, number> = {};
  for (const [date, hours] of Object.entries(weather.hoursByDate)) {
    let max = 0;
    for (const h of hours) {
      if (h.precipChance != null) max = Math.max(max, h.precipChance);
    }
    if (max > 0) out[date] = max;
  }
  return out;
}
