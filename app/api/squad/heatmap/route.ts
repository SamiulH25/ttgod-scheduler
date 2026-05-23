import { NextRequest, NextResponse } from "next/server";
import { requireSession } from "@/lib/auth";
import { handleApiError, jsonError } from "@/lib/api-response";
import { prisma } from "@/lib/db";
import { parseRangeParams } from "@/lib/dates";
import { guildMemberUserIds, resolveActiveGuildId } from "@/lib/guild-context";
import { ensureDefaultGuildForUser } from "@/lib/guild";
import { buildSquadHeatmap } from "@/lib/squad-heatmap";

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

    const { searchParams } = request.nextUrl;
    const { from, to } = parseRangeParams(
      searchParams.get("from"),
      searchParams.get("to"),
    );

    const memberIds = await guildMemberUserIds(guildId);
    if (memberIds.length === 0) {
      return NextResponse.json({ cells: [], weekStart: from.toISOString() });
    }

    const blocks = await prisma.availabilityBlock.findMany({
      where: {
        userId: { in: memberIds },
        start: { lt: to },
        end: { gt: from },
      },
      select: { userId: true, start: true, end: true, status: true },
    });

    const cells = buildSquadHeatmap(from, blocks);
    return NextResponse.json({ cells, weekStart: from.toISOString(), guildId });
  } catch (err) {
    return handleApiError(err);
  }
}
