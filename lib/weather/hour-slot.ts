import type { HourWeather } from "@/lib/weather/types";

/** Match Open-Meteo hourly row to a calendar grid hour (0–23). */
export function weatherForHour(
  hours: HourWeather[] | undefined,
  dayKey: string,
  hour: number,
): HourWeather | undefined {
  if (!hours?.length) return undefined;
  const target = `${dayKey}T${String(hour).padStart(2, "0")}:00`;
  return hours.find((h) => h.time.startsWith(target));
}
