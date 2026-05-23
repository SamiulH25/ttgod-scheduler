import { NextRequest, NextResponse } from "next/server";
import { logActivity } from "@/lib/activity";
import { requireSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getEventForUser } from "@/lib/event-access";
import { handleApiError, jsonError } from "@/lib/api-response";
import { eventOptionVoteSchema } from "@/lib/validations";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string }> };

export async function PUT(request: NextRequest, { params }: Params) {
  try {
    const { user, error } = await requireSession();
    if (error) return error;

    const { id: eventId } = await params;
    const event = await getEventForUser(eventId, user!.id);
    if (!event) {
      return jsonError("Event not found", "NOT_FOUND", 404);
    }
    if (event.phase !== "interest" && event.phase !== "scheduling") {
      return jsonError("Voting closed for this campaign", "BAD_REQUEST", 400);
    }

    const body = eventOptionVoteSchema.parse(await request.json());
    const opt = await prisma.eventOption.findFirst({
      where: { id: body.optionId, eventId },
    });
    if (!opt) {
      return jsonError("Option not found", "NOT_FOUND", 404);
    }

    await prisma.eventOptionVote.upsert({
      where: { eventId_userId: { eventId, userId: user!.id } },
      create: {
        eventId,
        userId: user!.id,
        optionId: body.optionId,
      },
      update: { optionId: body.optionId },
    });

    await logActivity({
      type: "option.voted",
      actorId: user!.id,
      entityType: "event",
      entityId: eventId,
      metadata: { optionId: body.optionId },
    });

    return NextResponse.json({ ok: true, optionId: body.optionId });
  } catch (err) {
    return handleApiError(err);
  }
}
