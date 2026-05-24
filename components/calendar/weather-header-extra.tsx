"use client";

import { format } from "date-fns";
import type { WeekWeatherState } from "@/components/calendar/use-week-weather";
import { WeatherDayChip } from "@/components/calendar/weather-day-chip";
import type { WeekWeather } from "@/lib/weather/types";

type WeatherHeaderExtraProps = {
  day: Date;
  weatherState: WeekWeatherState;
  overlapBadge?: React.ReactNode;
};

function dayWeather(
  weather: WeekWeather,
  day: Date,
): { day: WeekWeather["days"][0]; hours: WeekWeather["hoursByDate"][string] } | null {
  const key = format(day, "yyyy-MM-dd");
  const d = weather.days.find((x) => x.date === key);
  if (!d) return null;
  return { day: d, hours: weather.hoursByDate[key] ?? [] };
}

export function WeatherHeaderExtra({
  day,
  weatherState,
  overlapBadge,
}: WeatherHeaderExtraProps) {
  const weatherChip =
    weatherState.status === "ready"
      ? (() => {
          const match = dayWeather(weatherState.weather, day);
          if (!match) return null;
          return (
            <WeatherDayChip day={match.day} hours={match.hours} />
          );
        })()
      : null;

  if (!weatherChip && !overlapBadge) return null;

  return (
    <div className="flex flex-col items-center gap-0.5">
      {weatherChip}
      {overlapBadge}
    </div>
  );
}
