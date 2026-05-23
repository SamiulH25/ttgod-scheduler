import { NextRequest, NextResponse } from "next/server";
import { logActivity } from "@/lib/activity";
import { requireSession } from "@/lib/auth";
import { handleApiError, jsonError } from "@/lib/api-response";
import { resolveActiveGuildId } from "@/lib/guild-context";
import { ensureDefaultGuildForUser } from "@/lib/guild";
import { prisma } from "@/lib/db";
import { createSoftHold, listActiveSoftHolds } from "@/lib/soft-holds";
import { softHoldCreateSchema } from "@/lib/validations";

export const dynamic = "force-dynamic";

async function memberOf(userId: string, guildId: string) {
  const m = await prisma.guildMember.findUnique({
    where: { guildId_userId: { guildId, userId } },
  });
  return Boolean(m);
}

export async function GET() {
  try {
    const { user, error } = await requireSession();
    if (error) return error;

    const guildId = await resolveActiveGuildId(user!.id);
    if (!guildId) {
      return NextResponse.json({ holds: [], guildId: null });
    }
    const holds = await listActiveSoftHolds(guildId);
    return NextResponse.json({ holds, guildId });
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

    const body = softHoldCreateSchema.parse(await request.json());
    const start = new Date(body.start);
    const end = new Date(body.end);
    const expiresAt = body.expiresAt ? new Date(body.expiresAt) : undefined;

    const created = await createSoftHold({
      guildId,
      createdById: user!.id,
      title: body.title,
      start,
      end,
      expiresAt,
    });
    if (!created.ok) {
      return jsonError(
        created.reason === "bad_range" ? "End must be after start" : "Invalid expiry",
        "BAD_REQUEST",
        400,
      );
    }

    await logActivity({
      type: "soft_hold.created",
      actorId: user!.id,
      entityType: "soft_hold",
      entityId: created.hold.id,
      metadata: { guildId },
    });

    return NextResponse.json({ hold: created.hold }, { status: 201 });
  } catch (err) {
    return handleApiError(err);
  }
}
