import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { handleApiError, jsonError } from "@/lib/api-response";
import { createPublicWeekShareToken } from "@/lib/public-share";
import { isoDateTime } from "@/lib/validations";

const postSchema = z.object({
  guildId: z.string().min(1).optional(),
  expiresAt: isoDateTime.optional().nullable(),
});

export async function POST(request: NextRequest) {
  try {
    const { user, error } = await requireSession();
    if (error) return error;

    const body = postSchema.parse(await request.json());
    const u = await prisma.user.findUnique({
      where: { id: user!.id },
      select: { lastGuildId: true },
    });
    const guildId = body.guildId ?? u?.lastGuildId;
    if (!guildId) {
      return jsonError("Pick a guild first", "BAD_REQUEST", 400);
    }

    const member = await prisma.guildMember.findFirst({
      where: { userId: user!.id, guildId },
    });
    if (!member) {
      return jsonError("Not a member of that guild", "FORBIDDEN", 403);
    }

    const expiresAt = body.expiresAt ? new Date(body.expiresAt) : null;

    const row = await createPublicWeekShareToken({
      guildId,
      createdById: user!.id,
      expiresAt,
    });

    return NextResponse.json({
      token: row.token,
      url: `/public/week/${encodeURIComponent(row.token)}`,
    });
  } catch (err) {
    return handleApiError(err);
  }
}
