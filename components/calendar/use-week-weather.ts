"use client";

import { format } from "date-fns";
import { useCallback, useEffect, useState } from "react";
import type { WeekWeather } from "@/lib/weather/types";

export type WeekWeatherState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "unconfigured" }
  | { status: "error" }
  | { status: "ready"; weather: WeekWeather };

export function useWeekWeather(weekStart: Date) {
  const [state, setState] = useState<WeekWeatherState>({ status: "idle" });
  const weekKey = format(weekStart, "yyyy-MM-dd");

  const load = useCallback(async () => {
    setState({ status: "loading" });
    const res = await fetch(`/api/weather/week?start=${weekKey}`);
    if (res.status === 404) {
      setState({ status: "unconfigured" });
      return;
    }
    if (!res.ok) {
      setState({ status: "error" });
      return;
    }
    const data = (await res.json()) as {
      configured: boolean;
      weather?: WeekWeather;
    };
    if (!data.configured || !data.weather) {
      setState({ status: "unconfigured" });
      return;
    }
    setState({ status: "ready", weather: data.weather });
  }, [weekKey]);

  useEffect(() => {
    void load();
  }, [load]);

  return { state, reload: load };
}
