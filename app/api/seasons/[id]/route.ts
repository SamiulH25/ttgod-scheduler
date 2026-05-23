import { NextRequest, NextResponse } from "next/server";
import { requireSession } from "@/lib/auth";
import { handleApiError, jsonError } from "@/lib/api-response";
import { prisma } from "@/lib/db";
import { resolveActiveGuildId } from "@/lib/guild-context";
import { seasonUpdateSchema } from "@/lib/validations";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string }> };

async function assertSeasonInActiveGuild(userId: string, seasonId: string) {
  const guildId = await resolveActiveGuildId(userId);
  if (!guildId) return { season: null as null, guildId: null as null };
  const season = await prisma.season.findFirst({
    where: { id: seasonId, guildId },
  });
  return { season, guildId };
}

export async function PATCH(request: NextRequest, { params }: Params) {
  try {
    const { user, error } = await requireSession();
    if (error) return error;

    const { id } = await params;
    const { season } = await assertSeasonInActiveGuild(user!.id, id);
    if (!season) {
      return jsonError("Season not found", "NOT_FOUND", 404);
    }

    const body = seasonUpdateSchema.parse(await request.json());
    const updated = await prisma.season.update({
      where: { id },
      data: {
        name: body.name ?? undefined,
        color: body.color ?? undefined,
        sortOrder: body.sortOrder ?? undefined,
      },
    });

    return NextResponse.json({ season: updated });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function DELETE(_request: NextRequest, { params }: Params) {
  try {
    const { user, error } = await requireSession();
    if (error) return error;

    const { id } = await params;
    const { season } = await assertSeasonInActiveGuild(user!.id, id);
    if (!season) {
      return jsonError("Season not found", "NOT_FOUND", 404);
    }

    await prisma.event.updateMany({
      where: { seasonId: id },
      data: { seasonId: null },
    });
    await prisma.season.delete({ where: { id } });

    return NextResponse.json({ ok: true });
  } catch (err) {
    return handleApiError(err);
  }
}
