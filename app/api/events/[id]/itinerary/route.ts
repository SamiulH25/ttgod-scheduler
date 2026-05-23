import { NextRequest, NextResponse } from "next/server";
import { requireSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { handleApiError, jsonError } from "@/lib/api-response";
import { getEventForUser, requireEventHost } from "@/lib/event-access";
import { itineraryItemCreateSchema } from "@/lib/validations";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, { params }: Params) {
  try {
    const { user, error } = await requireSession();
    if (error) return error;

    const { id } = await params;
    const event = await getEventForUser(id, user!.id);
    if (!event) {
      return jsonError("Event not found", "NOT_FOUND", 404);
    }

    return NextResponse.json({ items: event.planItems });
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

    const body = itineraryItemCreateSchema.parse(await request.json());

    const maxOrder = await prisma.eventPlanItem.aggregate({
      where: { eventId },
      _max: { sortOrder: true },
    });
    const sortOrder = body.sortOrder ?? (maxOrder._max.sortOrder ?? -1) + 1;

    const item = await prisma.eventPlanItem.create({
      data: {
        eventId,
        title: body.title,
        notes: body.notes,
        startsAt: body.startsAt ? new Date(body.startsAt) : null,
        sortOrder,
        ...(body.url !== undefined && { url: body.url }),
        ...(body.checklist !== undefined && { checklist: body.checklist }),
        ...(body.kind !== undefined && { kind: body.kind }),
        ...(body.location !== undefined && { location: body.location }),
      },
    });

    return NextResponse.json({ item }, { status: 201 });
  } catch (err) {
    return handleApiError(err);
  }
}
