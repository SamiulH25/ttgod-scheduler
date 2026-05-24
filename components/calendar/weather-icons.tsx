import type { WeatherIconKey } from "@/lib/weather/types";
import { cn } from "@/lib/utils";

type WeatherIconProps = {
  icon: WeatherIconKey;
  className?: string;
};

export function WeatherIcon({ icon, className }: WeatherIconProps) {
  const common = cn("inline-block shrink-0", className);
  switch (icon) {
    case "clear":
      return (
        <svg className={common} viewBox="0 0 24 24" aria-hidden>
          <circle cx="12" cy="12" r="5" fill="currentColor" opacity="0.9" />
          <g stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M4.9 19.1l2.1-2.1M17 7l2.1-2.1" />
          </g>
        </svg>
      );
    case "partlyCloudy":
      return (
        <svg className={common} viewBox="0 0 24 24" aria-hidden>
          <circle cx="8" cy="9" r="3.5" fill="currentColor" />
          <path
            fill="currentColor"
            opacity="0.85"
            d="M7 14h10a4 4 0 0 0 .4-8 5.5 5.5 0 0 0-10.6 1.8A3.5 3.5 0 0 0 7 14z"
          />
        </svg>
      );
    case "rain":
    case "drizzle":
      return (
        <svg className={common} viewBox="0 0 24 24" aria-hidden>
          <path
            fill="currentColor"
            d="M6 13h12a3.5 3.5 0 0 0 .3-7A5 5 0 0 0 6.2 8.5 3 3 0 0 0 6 13z"
          />
          <g stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M8 17v3M12 16v4M16 17v3" />
          </g>
        </svg>
      );
    case "snow":
      return (
        <svg className={common} viewBox="0 0 24 24" aria-hidden>
          <path
            fill="currentColor"
            d="M6 12h12a3.5 3.5 0 0 0 .3-7A5 5 0 0 0 6.2 7.5 3 3 0 0 0 6 12z"
          />
          <g stroke="currentColor" strokeWidth="1.5">
            <path d="M8 16l0 4M12 15l0 5M16 16l0 4M10 17h4M10 19h4" />
          </g>
        </svg>
      );
    case "thunderstorm":
      return (
        <svg className={common} viewBox="0 0 24 24" aria-hidden>
          <path
            fill="currentColor"
            d="M6 11h12a3.5 3.5 0 0 0 .3-7A5 5 0 0 0 6.2 6.5 3 3 0 0 0 6 11z"
          />
          <path fill="currentColor" d="M11 13l-2 5h3l-1 4 5-7h-3l2-2z" />
        </svg>
      );
    case "fog":
    case "cloudy":
    default:
      return (
        <svg className={common} viewBox="0 0 24 24" aria-hidden>
          <path
            fill="currentColor"
            d="M5 14h14a4 4 0 0 0 .4-8 6 6 0 0 0-11.5 2.2A3.5 3.5 0 0 0 5 14z"
          />
        </svg>
      );
  }
}
