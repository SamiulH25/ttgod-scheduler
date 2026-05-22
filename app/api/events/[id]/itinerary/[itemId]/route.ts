import { NextRequest, NextResponse } from "next/server";
import { requireSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { handleApiError, jsonError } from "@/lib/api-response";
import { requireEventHost } from "@/lib/event-access";
import { itineraryItemUpdateSchema } from "@/lib/validations";

type Params = { params: Promise<{ id: string; itemId: string }> };

export async function PATCH(request: NextRequest, { params }: Params) {
  try {
    const { user, error } = await requireSession();
    if (error) return error;

    const { id: eventId, itemId } = await params;
    const hostCheck = await requireEventHost(eventId, user!.id);
    if (hostCheck.error) return hostCheck.error;

    const body = itineraryItemUpdateSchema.parse(await request.json());

    const existing = await prisma.eventPlanItem.findFirst({
      where: { id: itemId, eventId },
    });
    if (!existing) {
      return jsonError("Plan item not found", "NOT_FOUND", 404);
    }

    const item = await prisma.eventPlanItem.update({
      where: { id: itemId },
      data: {
        title: body.title ?? undefined,
        notes: body.notes === undefined ? undefined : body.notes,
        startsAt:
          body.startsAt === undefined
            ? undefined
            : body.startsAt
              ? new Date(body.startsAt)
              : null,
        sortOrder: body.sortOrder ?? undefined,
      },
    });

    return NextResponse.json({ item });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function DELETE(_request: NextRequest, { params }: Params) {
  try {
    const { user, error } = await requireSession();
    if (error) return error;

    const { id: eventId, itemId } = await params;
    const hostCheck = await requireEventHost(eventId, user!.id);
    if (hostCheck.error) return hostCheck.error;

    const existing = await prisma.eventPlanItem.findFirst({
      where: { id: itemId, eventId },
    });
    if (!existing) {
      return jsonError("Plan item not found", "NOT_FOUND", 404);
    }

    await prisma.eventPlanItem.delete({ where: { id: itemId } });

    return NextResponse.json({ ok: true });
  } catch (err) {
    return handleApiError(err);
  }
}
