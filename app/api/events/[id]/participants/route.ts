import { NextRequest, NextResponse } from "next/server";
import { requireSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { handleApiError, jsonError } from "@/lib/api-response";
import { requireEventHost, eventInclude } from "@/lib/event-access";
import { eventParticipantsAddSchema } from "@/lib/validations";

type Params = { params: Promise<{ id: string }> };

export async function POST(request: NextRequest, { params }: Params) {
  try {
    const { user, error } = await requireSession();
    if (error) return error;

    const { id: eventId } = await params;
    const hostCheck = await requireEventHost(eventId, user!.id);
    if (hostCheck.error) return hostCheck.error;

    const { userIds } = eventParticipantsAddSchema.parse(await request.json());

    const existing = await prisma.eventParticipant.findMany({
      where: { eventId },
      select: { userId: true },
    });
    const existingIds = new Set(existing.map((p) => p.userId));

    const toAdd = userIds.filter(
      (uid) => uid !== user!.id && !existingIds.has(uid),
    );
    if (toAdd.length > 0) {
      await prisma.eventParticipant.createMany({
        data: toAdd.map((userId) => ({
          eventId,
          userId,
          status: "pending",
        })),
      });
    }

    const event = await prisma.event.findUnique({
      where: { id: eventId },
      include: eventInclude,
    });

    return NextResponse.json({ event });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function DELETE(request: NextRequest, { params }: Params) {
  try {
    const { user, error } = await requireSession();
    if (error) return error;

    const { id: eventId } = await params;
    const hostCheck = await requireEventHost(eventId, user!.id);
    if (hostCheck.error) return hostCheck.error;

    const { searchParams } = request.nextUrl;
    const targetUserId = searchParams.get("userId");
    if (!targetUserId) {
      return jsonError("userId query required", "VALIDATION_ERROR", 400);
    }

    if (targetUserId === user!.id) {
      return jsonError("Host cannot remove themselves", "FORBIDDEN", 403);
    }

    await prisma.eventParticipant.deleteMany({
      where: { eventId, userId: targetUserId },
    });

    const event = await prisma.event.findUnique({
      where: { id: eventId },
      include: eventInclude,
    });

    return NextResponse.json({ event });
  } catch (err) {
    return handleApiError(err);
  }
}
