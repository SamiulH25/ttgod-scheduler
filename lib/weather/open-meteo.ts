import { addDays, format } from "date-fns";
import { normalizeForecast } from "@/lib/weather/normalize";
import type { WeekWeather } from "@/lib/weather/types";

export type FetchWeekWeatherParams = {
  latitude: number;
  longitude: number;
  timezone: string;
  startDate: Date;
  endDate: Date;
  locationLabel: string;
};

export async function fetchWeekWeather(
  params: FetchWeekWeatherParams,
): Promise<WeekWeather> {
  const start = format(params.startDate, "yyyy-MM-dd");
  const end = format(params.endDate, "yyyy-MM-dd");
  const search = new URLSearchParams({
    latitude: String(params.latitude),
    longitude: String(params.longitude),
    timezone: params.timezone,
    start_date: start,
    end_date: end,
    daily: "weather_code,temperature_2m_max,temperature_2m_min",
    hourly:
      "temperature_2m,weather_code,precipitation_probability",
  });
  const res = await fetch(
    `https://api.open-meteo.com/v1/forecast?${search}`,
    { cache: "no-store" },
  );
  if (!res.ok) {
    throw new Error(`Forecast failed: ${res.status}`);
  }
  const raw = await res.json();
  return normalizeForecast(raw, params.locationLabel);
}

export function weekEndFromStart(weekStart: Date): Date {
  return addDays(weekStart, 6);
}
