import type { WeatherIconKey } from "@/lib/weather/types";

export function weatherCodeMeta(code: number): {
  icon: WeatherIconKey;
  label: string;
} {
  if (code === 0) return { icon: "clear", label: "Clear" };
  if (code <= 3) return { icon: "partlyCloudy", label: "Partly cloudy" };
  if (code <= 48) return { icon: "fog", label: "Fog" };
  if (code <= 57) return { icon: "drizzle", label: "Drizzle" };
  if (code <= 67) return { icon: "rain", label: "Rain" };
  if (code <= 77) return { icon: "snow", label: "Snow" };
  if (code <= 82) return { icon: "rain", label: "Showers" };
  if (code <= 86) return { icon: "snow", label: "Snow showers" };
  if (code >= 95) return { icon: "thunderstorm", label: "Thunderstorm" };
  return { icon: "cloudy", label: "Cloudy" };
}
