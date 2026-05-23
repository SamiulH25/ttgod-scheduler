import { NextRequest, NextResponse } from "next/server";
import { logActivity } from "@/lib/activity";
import { requireSession } from "@/lib/auth";
import { handleApiError, jsonError } from "@/lib/api-response";
import { prisma } from "@/lib/db";
import { resolveActiveGuildId } from "@/lib/guild-context";
import { ensureDefaultGuildForUser } from "@/lib/guild";
import { seasonCreateSchema } from "@/lib/validations";

export const dynamic = "force-dynamic";

async function memberOf(userId: string, guildId: string) {
  return prisma.guildMember.findUnique({
    where: { guildId_userId: { guildId, userId } },
  });
}

export async function GET() {
  try {
    const { user, error } = await requireSession();
    if (error) return error;

    await ensureDefaultGuildForUser(user!.id);
    const guildId = await resolveActiveGuildId(user!.id);
    if (!guildId) {
      return NextResponse.json({ seasons: [], guildId: null });
    }
    const seasons = await prisma.season.findMany({
      where: { guildId },
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    });
    return NextResponse.json({ seasons, guildId });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function POST(request: NextRequest) {
  try {
    const { user, error } = await requireSession();
    if (error) return error;

    await ensureDefaultGuildForUser(user!.id);
    const guildId = await resolveActiveGuildId(user!.id);
    if (!guildId) {
      return jsonError("No active guild", "BAD_REQUEST", 400);
    }
    if (!(await memberOf(user!.id, guildId))) {
      return jsonError("Not a guild member", "FORBIDDEN", 403);
    }

    const body = seasonCreateSchema.parse(await request.json());
    const season = await prisma.season.create({
      data: {
        guildId,
        name: body.name,
        color: body.color ?? "#c4a574",
        sortOrder: body.sortOrder ?? 0,
      },
    });

    await logActivity({
      type: "season.created",
      actorId: user!.id,
      entityType: "season",
      entityId: season.id,
      metadata: { guildId },
    });

    return NextResponse.json({ season }, { status: 201 });
  } catch (err) {
    return handleApiError(err);
  }
}
