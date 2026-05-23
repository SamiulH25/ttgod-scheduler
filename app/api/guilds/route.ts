import { NextRequest, NextResponse } from "next/server";
import { requireSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { handleApiError, jsonError } from "@/lib/api-response";
import { z } from "zod";
import { listGuildsForUser, setUserActiveGuild, allocateGuildJoinCode } from "@/lib/guild";

const patchBodySchema = z
  .object({
    guildId: z.string().min(1).optional(),
    regenerateJoinCode: z.literal(true).optional(),
  })
  .superRefine((data, ctx) => {
    if (!data.regenerateJoinCode && !data.guildId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Provide guildId to switch, or regenerateJoinCode: true",
      });
    }
  });

export async function GET() {
  try {
    const { user, error } = await requireSession();
    if (error) return error;

    const guilds = await listGuildsForUser(user!.id);
    const u = await prisma.user.findUnique({
      where: { id: user!.id },
      select: { lastGuildId: true },
    });
    return NextResponse.json({
      guilds,
      activeGuildId: u?.lastGuildId ?? guilds[0]?.id ?? null,
    });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const { user, error } = await requireSession();
    if (error) return error;

    const body = patchBodySchema.parse(await request.json());
    if (body.regenerateJoinCode) {
      const u = await prisma.user.findUnique({
        where: { id: user!.id },
        select: { lastGuildId: true },
      });
      const guildId = body.guildId ?? u?.lastGuildId;
      if (!guildId) {
        return jsonError("No active guild", "BAD_REQUEST", 400);
      }
      const member = await prisma.guildMember.findFirst({
        where: { userId: user!.id, guildId },
      });
      if (!member) {
        return jsonError("Not a member of that guild", "FORBIDDEN", 403);
      }
      const joinCode = await allocateGuildJoinCode(guildId);
      return NextResponse.json({ ok: true, guildId, joinCode });
    }

    const gid = body.guildId!;
    try {
      await setUserActiveGuild(user!.id, gid);
    } catch {
      return jsonError("Not a member of that guild", "FORBIDDEN", 403);
    }
    return NextResponse.json({ ok: true, lastGuildId: gid });
  } catch (err) {
    return handleApiError(err);
  }
}
