import { NextRequest, NextResponse } from "next/server";
import { requireSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { handleApiError, jsonError } from "@/lib/api-response";
import { guildMemberUserIds, resolveActiveGuildId } from "@/lib/guild-context";
import { ensureDefaultGuildForUser } from "@/lib/guild";
import { compareWeeksAvailability } from "@/lib/week-compare";
import { weekCompareQuerySchema } from "@/lib/validations";

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

    const parsed = weekCompareQuerySchema.safeParse({
      weekAStart: request.nextUrl.searchParams.get("weekAStart") ?? undefined,
      weekBStart: request.nextUrl.searchParams.get("weekBStart") ?? undefined,
    });
    if (!parsed.success) {
      return jsonError("Invalid week params", "BAD_REQUEST", 400);
    }

    const weekAStart = new Date(parsed.data.weekAStart);
    const weekBStart = new Date(parsed.data.weekBStart);
    const spanStart = weekAStart < weekBStart ? weekAStart : weekBStart;
    const spanEnd = new Date(
      Math.max(weekAStart.getTime(), weekBStart.getTime()) + 7 * 86400000,
    );

    const memberIds = await guildMemberUserIds(guildId);
    const blocks = await prisma.availabilityBlock.findMany({
      where: {
        userId: { in: memberIds },
        start: { lt: spanEnd },
        end: { gt: spanStart },
      },
      select: { userId: true, start: true, end: true, status: true },
    });

    const result = compareWeeksAvailability({
      weekAStart,
      weekBStart,
      userIds: memberIds,
      blocks,
    });

    return NextResponse.json({ compare: result });
  } catch (err) {
    return handleApiError(err);
  }
}
