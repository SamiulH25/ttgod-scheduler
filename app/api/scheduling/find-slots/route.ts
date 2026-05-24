import { differenceInCalendarDays } from "date-fns";
import { NextRequest, NextResponse } from "next/server";
import { requireSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { handleApiError, jsonError } from "@/lib/api-response";
import { getEventForUser } from "@/lib/event-access";
import { guildMemberUserIds, resolveActiveGuildId } from "@/lib/guild-context";
import { ensureDefaultGuildForUser } from "@/lib/guild";
import {
  findRankedSlots,
  serializeRankedSlot,
} from "@/lib/scheduling/find-slots";
import { precipByDateFromWeek } from "@/lib/scheduling/weather-precip";
import { findSlotsQuerySchema } from "@/lib/validations";
import { cacheKey, getCached, setCached } from "@/lib/weather/cache";
import { fetchWeekWeather } from "@/lib/weather/open-meteo";
import { getWeekStart } from "@/lib/calendar";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const { user, error } = await requireSession();
    if (error) return error;

    await ensureDefaultGuildForUser(user!.id);
    const guildId = await resolveActiveGuildId(user!.id);
    if (!guildId) {
      return jsonError("No active guild", "BAD_REQUEST", 400);
    }

    const sp = request.nextUrl.searchParams;
    const parsed = findSlotsQuerySchema.safeParse({
      from: sp.get("from") ?? undefined,
      to: sp.get("to") ?? undefined,
      durationMinutes: sp.get("durationMinutes") ?? "120",
      eventId: sp.get("eventId") ?? undefined,
      participantUserIds: sp.get("participantUserIds") ?? undefined,
      includeTentative: sp.get("includeTentative") ?? undefined,
    });
    if (!parsed.success) {
      return jsonError("Invalid query", "BAD_REQUEST", 400);
    }

    const from = new Date(parsed.data.from);
    const to = new Date(parsed.data.to);
    const durationMinutes = parsed.data.durationMinutes;
    const includeTentative = parsed.data.includeTentative ?? false;

    let userIds: string[];
    let rosterSize: number;

    if (parsed.data.eventId) {
      const event = await getEventForUser(parsed.data.eventId, user!.id);
      if (!event) {
        return jsonError("Event not found", "NOT_FOUND", 404);
      }
      userIds = [
        ...new Set(
          event.participants
            .filter(
              (p) =>
                p.userId &&
                p.status !== "not_interested" &&
                p.status !== "declined",
            )
            .map((p) => p.userId as string),
        ),
      ];
      rosterSize = userIds.length;
    } else if (parsed.data.participantUserIds?.length) {
      const memberIds = new Set(await guildMemberUserIds(guildId));
      userIds = parsed.data.participantUserIds.filter((id) => memberIds.has(id));
      rosterSize = userIds.length;
    } else {
      userIds = await guildMemberUserIds(guildId);
      rosterSize = userIds.length;
    }

    if (userIds.length === 0) {
      return NextResponse.json({ slots: [] });
    }

    const blocks = await prisma.availabilityBlock.findMany({
      where: {
        userId: { in: userIds },
        start: { lt: to },
        end: { gt: from },
      },
      select: { userId: true, start: true, end: true, status: true },
    });

    const slices = blocks.map((b) => ({
      userId: b.userId,
      start: b.start,
      end: b.end,
      status: b.status,
    }));

    let precipByDate: Record<string, number> | undefined;
    const hostWeather = await prisma.user.findUnique({
      where: { id: user!.id },
      select: {
        weatherCity: true,
        weatherLatitude: true,
        weatherLongitude: true,
        timezone: true,
      },
    });
    if (
      hostWeather?.weatherLatitude != null &&
      hostWeather.weatherLongitude != null &&
      hostWeather.weatherCity
    ) {
      const weekStart = getWeekStart(from);
      const spanDays = Math.min(
        14,
        Math.max(1, differenceInCalendarDays(to, from) + 1),
      );
      const weekEnd = new Date(weekStart.getTime() + spanDays * 86400000);
      const key = cacheKey([
        "find-slots-precip",
        String(hostWeather.weatherLatitude),
        String(hostWeather.weatherLongitude),
        weekStart.toISOString(),
      ]);
      let weather = getCached<Awaited<ReturnType<typeof fetchWeekWeather>>>(key);
      if (!weather) {
        weather = await fetchWeekWeather({
          latitude: hostWeather.weatherLatitude,
          longitude: hostWeather.weatherLongitude,
          timezone: hostWeather.timezone || "UTC",
          startDate: weekStart,
          endDate: weekEnd,
          locationLabel: hostWeather.weatherCity,
        });
        setCached(key, weather);
      }
      precipByDate = precipByDateFromWeek(weather);
    }

    const minOverlap = parsed.data.eventId ? rosterSize : 2;
    const slots = findRankedSlots(
      userIds,
      slices,
      from,
      to,
      durationMinutes,
      {
        includeTentative,
        minOverlapCount: minOverlap,
        rosterSize,
        precipByDate,
        limit: 12,
      },
    );

    return NextResponse.json({
      slots: slots.map(serializeRankedSlot),
    });
  } catch (err) {
    return handleApiError(err);
  }
}
