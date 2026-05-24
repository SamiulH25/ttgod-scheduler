import { weatherCodeMeta } from "@/lib/weather/codes";
import type { DayWeather, HourWeather, WeekWeather } from "@/lib/weather/types";

type OpenMeteoForecast = {
  daily?: {
    time?: string[];
    weather_code?: number[];
    temperature_2m_max?: number[];
    temperature_2m_min?: number[];
  };
  hourly?: {
    time?: string[];
    temperature_2m?: number[];
    weather_code?: number[];
    precipitation_probability?: number[];
  };
};

export function normalizeForecast(
  raw: OpenMeteoForecast,
  locationLabel: string,
): WeekWeather {
  const days: DayWeather[] = [];
  const hoursByDate: Record<string, HourWeather[]> = {};

  const daily = raw.daily;
  if (daily?.time) {
    for (let i = 0; i < daily.time.length; i++) {
      const date = daily.time[i]!;
      const code = daily.weather_code?.[i] ?? 0;
      const meta = weatherCodeMeta(code);
      days.push({
        date,
        code,
        highC: daily.temperature_2m_max?.[i] ?? 0,
        lowC: daily.temperature_2m_min?.[i] ?? 0,
        icon: meta.icon,
        label: meta.label,
      });
    }
  }

  const hourly = raw.hourly;
  if (hourly?.time) {
    for (let i = 0; i < hourly.time.length; i++) {
      const hourTime: string = hourly.time[i]!;
      const date = hourTime.slice(0, 10);
      const code = hourly.weather_code?.[i] ?? 0;
      const meta = weatherCodeMeta(code);
      const row: HourWeather = {
        time: hourTime,
        tempC: hourly.temperature_2m?.[i] ?? 0,
        code,
        icon: meta.icon,
        label: meta.label,
        precipChance: hourly.precipitation_probability?.[i],
      };
      if (!hoursByDate[date]) hoursByDate[date] = [];
      hoursByDate[date]!.push(row);
    }
  }

  return { locationLabel, days, hoursByDate };
}
