export type WeatherIconKey =
  | "clear"
  | "partlyCloudy"
  | "cloudy"
  | "fog"
  | "drizzle"
  | "rain"
  | "snow"
  | "thunderstorm";

export type DayWeather = {
  date: string;
  code: number;
  highC: number;
  lowC: number;
  icon: WeatherIconKey;
  label: string;
};

export type HourWeather = {
  time: string;
  tempC: number;
  code: number;
  icon: WeatherIconKey;
  label: string;
  precipChance?: number;
};

export type WeekWeather = {
  locationLabel: string;
  days: DayWeather[];
  hoursByDate: Record<string, HourWeather[]>;
};

export type GeocodeResult = {
  id: number;
  name: string;
  admin1: string | null;
  country: string;
  latitude: number;
  longitude: number;
  label: string;
};
