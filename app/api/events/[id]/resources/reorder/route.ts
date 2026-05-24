import { NextRequest, NextResponse } from "next/server";
import { requireSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { handleApiError, jsonError } from "@/lib/api-response";
import { requireEventHost, eventInclude } from "@/lib/event-access";
import { eventResourceReorderSchema } from "@/lib/validations";

type Params = { params: Promise<{ id: string }> };

export async function POST(request: NextRequest, { params }: Params) {
  try {
    const { user, error } = await requireSession();
    if (error) return error;

    const { id: eventId } = await params;
    const hostCheck = await requireEventHost(eventId, user!.id);
    if (hostCheck.error) return hostCheck.error;

    const { orderedIds } = eventResourceReorderSchema.parse(await request.json());
    const existing = await prisma.eventResource.findMany({
      where: { eventId },
      select: { id: true },
    });
    const existingIds = new Set(existing.map((r) => r.id));
    if (
      orderedIds.length !== existing.length ||
      orderedIds.some((id) => !existingIds.has(id))
    ) {
      return jsonError("Invalid resource order", "BAD_REQUEST", 400);
    }

    await prisma.$transaction(
      orderedIds.map((id, index) =>
        prisma.eventResource.update({
          where: { id },
          data: { sortOrder: index },
        }),
      ),
    );

    const full = await prisma.event.findUnique({
      where: { id: eventId },
      include: eventInclude,
    });

    return NextResponse.json({ event: full });
  } catch (err) {
    return handleApiError(err);
  }
}
