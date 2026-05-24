import { NextRequest, NextResponse } from "next/server";
import { requireSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { handleApiError, jsonError } from "@/lib/api-response";
import {
  getEventForUser,
  requireEventHost,
  eventInclude,
} from "@/lib/event-access";
import { eventResourceCreateSchema } from "@/lib/validations";

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

    return NextResponse.json({ resources: event.resources });
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

    const body = eventResourceCreateSchema.parse(await request.json());
    const maxOrder = await prisma.eventResource.aggregate({
      where: { eventId },
      _max: { sortOrder: true },
    });
    const sortOrder = (maxOrder._max.sortOrder ?? -1) + 1;

    const resource = await prisma.eventResource.create({
      data: {
        eventId,
        kind: body.kind,
        title: body.title.trim(),
        url: body.url?.trim() || null,
        body: body.body?.trim() || null,
        address: body.address?.trim() || null,
        sortOrder,
        createdById: user!.id,
      },
      include: {
        createdBy: { select: { id: true, name: true, image: true } },
      },
    });

    const full = await prisma.event.findUnique({
      where: { id: eventId },
      include: eventInclude,
    });

    return NextResponse.json({ resource, event: full }, { status: 201 });
  } catch (err) {
    return handleApiError(err);
  }
}
