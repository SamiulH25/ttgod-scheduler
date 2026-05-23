import { NextRequest, NextResponse } from "next/server";
import { requireSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getEventForUser, requireEventHost } from "@/lib/event-access";
import { handleApiError, jsonError } from "@/lib/api-response";
import { eventOptionCreateSchema } from "@/lib/validations";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, { params }: Params) {
  try {
    const { user, error } = await requireSession();
    if (error) return error;

    const { id: eventId } = await params;
    const event = await getEventForUser(eventId, user!.id);
    if (!event) {
      return jsonError("Event not found", "NOT_FOUND", 404);
    }

    const options = await prisma.eventOption.findMany({
      where: { eventId },
      orderBy: { sortOrder: "asc" },
      include: {
        votes: { select: { userId: true } },
      },
    });

    const myVote = await prisma.eventOptionVote.findUnique({
      where: { eventId_userId: { eventId, userId: user!.id } },
    });

    return NextResponse.json({
      options: options.map((o) => ({
        id: o.id,
        label: o.label,
        sortOrder: o.sortOrder,
        voteCount: o.votes.length,
      })),
      myOptionId: myVote?.optionId ?? null,
    });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function POST(request: NextRequest, { params }: Params) {
  try {
    const { user, error } = await requireSession();
    if (error) return error;

    const { id: eventId } = await params;
    const hostCheck = await requireEventHost(eventId, user!.id);
    if (hostCheck.error) return hostCheck.error;

    const ev = hostCheck.event!;
    if (ev.phase !== "interest" && ev.phase !== "scheduling") {
      return jsonError("Poll is only open during interest or scheduling", "BAD_REQUEST", 400);
    }

    const body = eventOptionCreateSchema.parse(await request.json());
    const option = await prisma.eventOption.create({
      data: {
        eventId,
        label: body.label,
        sortOrder: body.sortOrder ?? 0,
      },
    });

    return NextResponse.json({ option }, { status: 201 });
  } catch (err) {
    return handleApiError(err);
  }
}
