import { NextRequest, NextResponse } from "next/server";
import { requireSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { handleApiError } from "@/lib/api-response";
import { preferencesSchema } from "@/lib/validations";
import { ensureUserCalendarToken, rotateUserCalendarToken } from "@/lib/calendar-token";

function publicBaseUrl(): string {
  const fromEnv =
    process.env.NEXTAUTH_URL?.replace(/\/$/, "") ??
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "");
  return fromEnv || "http://localhost:3000";
}

export async function GET() {
  try {
    const { user, error } = await requireSession();
    if (error) return error;

    const token = await ensureUserCalendarToken(user!.id);
    const base = publicBaseUrl();
    const calendarSubscribeUrl = `${base}/api/calendar/ics/${token}`;

    const row = await prisma.user.findUnique({
      where: { id: user!.id },
      select: {
        notificationPrefs: true,
        lastGuildId: true,
        awayUntil: true,
        quietHours: true,
        energyPreference: true,
      },
    });

    return NextResponse.json({
      timezone: user!.timezone,
      theme: user!.theme,
      font: user!.font,
      calendarSubscribeUrl,
      notificationPrefs: row?.notificationPrefs ?? null,
      lastGuildId: row?.lastGuildId ?? null,
      awayUntil: row?.awayUntil?.toISOString() ?? null,
      quietHours: row?.quietHours ?? null,
      energyPreference: row?.energyPreference ?? null,
    });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const { user, error } = await requireSession();
    if (error) return error;

    const body = preferencesSchema.parse(await request.json());

    let newToken: string | undefined;
    if (body.rotateCalendarToken) {
      newToken = await rotateUserCalendarToken(user!.id);
    }

    const data: {
      timezone?: string;
      theme?: string;
      font?: string;
      notificationPrefs?: string | null;
      lastGuildId?: string | null;
      awayUntil?: Date | null;
      quietHours?: string | null;
      energyPreference?: string | null;
    } = {};
    if (body.timezone !== undefined) data.timezone = body.timezone;
    if (body.theme !== undefined) data.theme = body.theme;
    if (body.font !== undefined) data.font = body.font;
    if (body.notificationPrefs !== undefined) {
      data.notificationPrefs = body.notificationPrefs;
    }
    if (body.lastGuildId !== undefined) {
      data.lastGuildId = body.lastGuildId;
    }
    if (body.awayUntil !== undefined) {
      data.awayUntil = body.awayUntil ? new Date(body.awayUntil) : null;
    }
    if (body.quietHours !== undefined) {
      data.quietHours = body.quietHours;
    }
    if (body.energyPreference !== undefined) {
      data.energyPreference = body.energyPreference;
    }

    const updated =
      Object.keys(data).length > 0
        ? await prisma.user.update({
            where: { id: user!.id },
            data,
          })
        : await prisma.user.findUniqueOrThrow({ where: { id: user!.id } });

    const token = newToken ?? (await ensureUserCalendarToken(user!.id));
    const base = publicBaseUrl();
    const calendarSubscribeUrl = `${base}/api/calendar/ics/${token}`;

    return NextResponse.json({
      timezone: updated.timezone,
      theme: updated.theme,
      font: updated.font,
      calendarSubscribeUrl,
      notificationPrefs: updated.notificationPrefs,
      lastGuildId: updated.lastGuildId,
      awayUntil: updated.awayUntil?.toISOString() ?? null,
      quietHours: updated.quietHours,
      energyPreference: updated.energyPreference,
    });
  } catch (err) {
    return handleApiError(err);
  }
}
