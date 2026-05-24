import { NextRequest, NextResponse } from "next/server";
import { requireSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { handleApiError, jsonError } from "@/lib/api-response";
import { requireEventHost, eventInclude } from "@/lib/event-access";
import { eventResourceUpdateSchema } from "@/lib/validations";

type Params = { params: Promise<{ id: string; resourceId: string }> };

export async function PATCH(request: NextRequest, { params }: Params) {
  try {
    const { user, error } = await requireSession();
    if (error) return error;

    const { id: eventId, resourceId } = await params;
    const hostCheck = await requireEventHost(eventId, user!.id);
    if (hostCheck.error) return hostCheck.error;

    const existing = await prisma.eventResource.findFirst({
      where: { id: resourceId, eventId },
    });
    if (!existing) {
      return jsonError("Resource not found", "NOT_FOUND", 404);
    }

    const body = eventResourceUpdateSchema.parse(await request.json());
    const kind = body.kind ?? existing.kind;

    const resource = await prisma.eventResource.update({
      where: { id: resourceId },
      data: {
        kind: body.kind ?? undefined,
        title: body.title?.trim() ?? undefined,
        url:
          body.url === undefined
            ? undefined
            : body.url?.trim() || null,
        body:
          body.body === undefined
            ? undefined
            : body.body?.trim() || null,
        address:
          body.address === undefined
            ? undefined
            : body.address?.trim() || null,
        sortOrder: body.sortOrder ?? undefined,
      },
      include: {
        createdBy: { select: { id: true, name: true, image: true } },
      },
    });

    if (kind === "link" && !resource.url) {
      return jsonError("URL is required for links", "BAD_REQUEST", 400);
    }
    if (kind === "note" && !resource.body) {
      return jsonError("Note text is required", "BAD_REQUEST", 400);
    }
    if (kind === "location" && !resource.address) {
      return jsonError("Address is required for locations", "BAD_REQUEST", 400);
    }

    const full = await prisma.event.findUnique({
      where: { id: eventId },
      include: eventInclude,
    });

    return NextResponse.json({ resource, event: full });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function DELETE(_request: NextRequest, { params }: Params) {
  try {
    const { user, error } = await requireSession();
    if (error) return error;

    const { id: eventId, resourceId } = await params;
    const hostCheck = await requireEventHost(eventId, user!.id);
    if (hostCheck.error) return hostCheck.error;

    const existing = await prisma.eventResource.findFirst({
      where: { id: resourceId, eventId },
    });
    if (!existing) {
      return jsonError("Resource not found", "NOT_FOUND", 404);
    }

    await prisma.eventResource.delete({ where: { id: resourceId } });

    const full = await prisma.event.findUnique({
      where: { id: eventId },
      include: eventInclude,
    });

    return NextResponse.json({ event: full });
  } catch (err) {
    return handleApiError(err);
  }
}
