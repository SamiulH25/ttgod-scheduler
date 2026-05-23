import { NextRequest, NextResponse } from "next/server";
import { logActivity } from "@/lib/activity";
import { requireSession } from "@/lib/auth";
import { handleApiError, jsonError } from "@/lib/api-response";
import { prisma } from "@/lib/db";
import { resolveActiveGuildId } from "@/lib/guild-context";
import { ensureDefaultGuildForUser } from "@/lib/guild";
import { wallNoteCreateSchema } from "@/lib/validations";

export const dynamic = "force-dynamic";

async function expireWallNotes(guildId: string) {
  const now = new Date();
  await prisma.wallNote.deleteMany({
    where: { guildId, expiresAt: { lt: now } },
  });
}

export async function GET() {
  try {
    const { user, error } = await requireSession();
    if (error) return error;

    await ensureDefaultGuildForUser(user!.id);
    const guildId = await resolveActiveGuildId(user!.id);
    if (!guildId) {
      return NextResponse.json({ notes: [], guildId: null });
    }
    await expireWallNotes(guildId);
    const notes = await prisma.wallNote.findMany({
      where: { guildId },
      orderBy: { createdAt: "desc" },
      take: 12,
      include: {
        createdBy: { select: { id: true, name: true, image: true } },
      },
    });
    return NextResponse.json({ notes, guildId });
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
    const member = await prisma.guildMember.findUnique({
      where: { guildId_userId: { guildId, userId: user!.id } },
    });
    if (!member) {
      return jsonError("Not a guild member", "FORBIDDEN", 403);
    }

    const body = wallNoteCreateSchema.parse(await request.json());
    const expiresAt = new Date(body.expiresAt);
    if (expiresAt <= new Date()) {
      return jsonError("expiresAt must be in the future", "BAD_REQUEST", 400);
    }

    const note = await prisma.wallNote.create({
      data: {
        guildId,
        createdById: user!.id,
        body: body.body,
        expiresAt,
      },
      include: {
        createdBy: { select: { id: true, name: true, image: true } },
      },
    });

    await logActivity({
      type: "wall_note.updated",
      actorId: user!.id,
      entityType: "wall_note",
      entityId: note.id,
      metadata: { guildId },
    });

    return NextResponse.json({ note }, { status: 201 });
  } catch (err) {
    return handleApiError(err);
  }
}
