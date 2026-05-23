import { NextRequest, NextResponse } from "next/server";
import { requireSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { handleApiError, jsonError } from "@/lib/api-response";
import { squadGroupUpdateSchema } from "@/lib/validations";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string }> };

async function getAccessibleGroup(id: string, userId: string) {
  return prisma.squadGroup.findFirst({
    where: {
      id,
      OR: [{ createdById: userId }, { members: { some: { userId } } }],
    },
    include: {
      members: { include: { user: { select: { id: true, name: true, image: true } } } },
    },
  });
}

export async function GET(_request: NextRequest, { params }: Params) {
  try {
    const { user, error } = await requireSession();
    if (error) return error;

    const { id } = await params;
    const group = await getAccessibleGroup(id, user!.id);
    if (!group) {
      return jsonError("Group not found", "NOT_FOUND", 404);
    }
    return NextResponse.json({ group });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function PATCH(request: NextRequest, { params }: Params) {
  try {
    const { user, error } = await requireSession();
    if (error) return error;

    const { id } = await params;
    const existing = await prisma.squadGroup.findFirst({
      where: { id, createdById: user!.id },
    });
    if (!existing) {
      return jsonError("Group not found", "NOT_FOUND", 404);
    }

    const body = squadGroupUpdateSchema.parse(await request.json());
    const group = await prisma.squadGroup.update({
      where: { id },
      data: { name: body.name ?? undefined },
      include: {
        members: { include: { user: { select: { id: true, name: true, image: true } } } },
      },
    });

    return NextResponse.json({ group });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function DELETE(_request: NextRequest, { params }: Params) {
  try {
    const { user, error } = await requireSession();
    if (error) return error;

    const { id } = await params;
    const existing = await prisma.squadGroup.findFirst({
      where: { id, createdById: user!.id },
    });
    if (!existing) {
      return jsonError("Group not found", "NOT_FOUND", 404);
    }

    await prisma.squadGroup.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (err) {
    return handleApiError(err);
  }
}
