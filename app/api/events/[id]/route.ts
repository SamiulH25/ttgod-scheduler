import { NextRequest, NextResponse } from "next/server";
import { requireSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { handleApiError, jsonError } from "@/lib/api-response";
import { findUsersFreeDuring } from "@/lib/event-availability";
import { getEventForUser, requireEventHost, eventInclude } from "@/lib/event-access";
import { eventUpdateSchema } from "@/lib/validations";

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

    const notifyTargets = await findUsersFreeDuring(event.start, event.end);

    return NextResponse.json({ event, notifyTargets });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function PATCH(request: NextRequest, { params }: Params) {
  try {
    const { user, error } = await requireSession();
    if (error) return error;

    const { id } = await params;
    const hostCheck = await requireEventHost(id, user!.id);
    if (hostCheck.error) return hostCheck.error;

    const body = eventUpdateSchema.parse(await request.json());

    const event = await prisma.event.update({
      where: { id },
      data: {
        title: body.title ?? undefined,
        description: body.description === undefined ? undefined : body.description,
        start: body.start ? new Date(body.start) : undefined,
        end: body.end ? new Date(body.end) : undefined,
        visibility: body.visibility ?? undefined,
      },
      include: eventInclude,
    });

    const notifyTargets = await findUsersFreeDuring(
      event.start,
      event.end,
    );

    return NextResponse.json({ event, notifyTargets });
  } catch (err) {
    return handleApiError(err);
  }
}
