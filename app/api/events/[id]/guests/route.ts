import { NextRequest, NextResponse } from "next/server";
import { requireSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { requireEventHost, eventInclude } from "@/lib/event-access";
import { handleApiError, jsonError } from "@/lib/api-response";
import { eventGuestCreateSchema } from "@/lib/validations";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string }> };

export async function POST(request: NextRequest, { params }: Params) {
  try {
    const { user, error } = await requireSession();
    if (error) return error;

    const { id: eventId } = await params;
    const hostCheck = await requireEventHost(eventId, user!.id);
    if (hostCheck.error) return hostCheck.error;

    const body = eventGuestCreateSchema.parse(await request.json());

    const dup = await prisma.eventParticipant.findFirst({
      where: { eventId, guestEmail: body.guestEmail },
    });
    if (dup) {
      return jsonError("Guest already invited", "CONFLICT", 409);
    }

    await prisma.eventParticipant.create({
      data: {
        eventId,
        userId: null,
        guestEmail: body.guestEmail,
        displayName: body.displayName,
        status: "pending",
      },
    });

    const event = await prisma.event.findUnique({
      where: { id: eventId },
      include: eventInclude,
    });

    return NextResponse.json({ event }, { status: 201 });
  } catch (err) {
    return handleApiError(err);
  }
}
