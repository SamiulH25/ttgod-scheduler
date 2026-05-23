import { NextRequest, NextResponse } from "next/server";
import { requireSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { requireEventHost } from "@/lib/event-access";
import { handleApiError, jsonError } from "@/lib/api-response";
import { eventRoleUpdateSchema } from "@/lib/validations";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string; roleId: string }> };

export async function PATCH(request: NextRequest, { params }: Params) {
  try {
    const { user, error } = await requireSession();
    if (error) return error;

    const { id: eventId, roleId } = await params;
    const hostCheck = await requireEventHost(eventId, user!.id);
    if (hostCheck.error) return hostCheck.error;

    const body = eventRoleUpdateSchema.parse(await request.json());
    const existing = await prisma.eventRole.findFirst({
      where: { id: roleId, eventId },
    });
    if (!existing) {
      return jsonError("Role not found", "NOT_FOUND", 404);
    }

    const role = await prisma.eventRole.update({
      where: { id: roleId },
      data: {
        name: body.name ?? undefined,
        maxCount: body.maxCount === undefined ? undefined : body.maxCount,
        sortOrder: body.sortOrder ?? undefined,
      },
    });

    return NextResponse.json({ role });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function DELETE(_request: NextRequest, { params }: Params) {
  try {
    const { user, error } = await requireSession();
    if (error) return error;

    const { id: eventId, roleId } = await params;
    const hostCheck = await requireEventHost(eventId, user!.id);
    if (hostCheck.error) return hostCheck.error;

    const existing = await prisma.eventRole.findFirst({
      where: { id: roleId, eventId },
    });
    if (!existing) {
      return jsonError("Role not found", "NOT_FOUND", 404);
    }

    await prisma.eventRole.delete({ where: { id: roleId } });
    return NextResponse.json({ ok: true });
  } catch (err) {
    return handleApiError(err);
  }
}
