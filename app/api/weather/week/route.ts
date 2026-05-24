import { parseISO } from "date-fns";
import { NextRequest, NextResponse } from "next/server";
import { requireSession } from "@/lib/auth";
import { handleApiError } from "@/lib/api-response";
import { prisma } from "@/lib/db";
import { weatherWeekQuerySchema } from "@/lib/validations";
import { cacheKey, getCached, setCached } from "@/lib/weather/cache";
import { fetchWeekWeather, weekEndFromStart } from "@/lib/weather/open-meteo";
import { getWeekStart } from "@/lib/calendar";

export async function GET(request: NextRequest) {
  try {
    const { user, error } = await requireSession();
    if (error) return error;

    const startParam = request.nextUrl.searchParams.get("start") ?? "";
    const { start } = weatherWeekQuerySchema.parse({ start: startParam });
    const weekStart = getWeekStart(parseISO(start));
    const weekEnd = weekEndFromStart(weekStart);

    const row = await prisma.user.findUnique({
      where: { id: user!.id },
      select: {
        weatherCity: true,
        weatherLatitude: true,
        weatherLongitude: true,
        timezone: true,
      },
    });

    if (
      row?.weatherLatitude == null ||
      row?.weatherLongitude == null ||
      !row.weatherCity
    ) {
      return NextResponse.json(
        { configured: false as const },
        { status: 404 },
      );
    }

    const key = cacheKey([
      String(row.weatherLatitude),
      String(row.weatherLongitude),
      row.timezone,
      start,
    ]);
    const cached = getCached<Awaited<ReturnType<typeof fetchWeekWeather>>>(key);
    if (cached) {
      return NextResponse.json({ configured: true as const, weather: cached });
    }

    const weather = await fetchWeekWeather({
      latitude: row.weatherLatitude,
      longitude: row.weatherLongitude,
      timezone: row.timezone || "UTC",
      startDate: weekStart,
      endDate: weekEnd,
      locationLabel: row.weatherCity,
    });

    setCached(key, weather);
    return NextResponse.json({ configured: true as const, weather });
  } catch (err) {
    return handleApiError(err);
  }
}
