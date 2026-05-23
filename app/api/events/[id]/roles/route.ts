import { NextRequest, NextResponse } from "next/server";
import { requireSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getEventForUser, requireEventHost } from "@/lib/event-access";
import { handleApiError, jsonError } from "@/lib/api-response";
import { eventRoleCreateSchema } from "@/lib/validations";

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

    const roles = await prisma.eventRole.findMany({
      where: { eventId },
      orderBy: { sortOrder: "asc" },
    });
    return NextResponse.json({ roles });
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

    const body = eventRoleCreateSchema.parse(await request.json());
    const role = await prisma.eventRole.create({
      data: {
        eventId,
        name: body.name,
        maxCount: body.maxCount ?? null,
        sortOrder: body.sortOrder ?? 0,
      },
    });

    return NextResponse.json({ role }, { status: 201 });
  } catch (err) {
    return handleApiError(err);
  }
}
