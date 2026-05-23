import { NextRequest, NextResponse } from "next/server";
import { requireSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { handleApiError, jsonError } from "@/lib/api-response";
import { squadGroupMembersSchema } from "@/lib/validations";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string }> };

export async function POST(request: NextRequest, { params }: Params) {
  try {
    const { user, error } = await requireSession();
    if (error) return error;

    const { id: groupId } = await params;
    const group = await prisma.squadGroup.findFirst({
      where: { id: groupId, createdById: user!.id },
    });
    if (!group) {
      return jsonError("Group not found", "NOT_FOUND", 404);
    }

    const body = squadGroupMembersSchema.parse(await request.json());
    const existing = await prisma.squadGroupMember.findMany({
      where: { groupId, userId: { in: body.userIds } },
      select: { userId: true },
    });
    const have = new Set(existing.map((m) => m.userId));
    const toAdd = body.userIds.filter((uid) => !have.has(uid));
    if (toAdd.length > 0) {
      await prisma.squadGroupMember.createMany({
        data: toAdd.map((userId) => ({ groupId, userId })),
      });
    }

    const updated = await prisma.squadGroup.findUniqueOrThrow({
      where: { id: groupId },
      include: {
        members: { include: { user: { select: { id: true, name: true, image: true } } } },
      },
    });

    return NextResponse.json({ group: updated });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function DELETE(request: NextRequest, { params }: Params) {
  try {
    const { user, error } = await requireSession();
    if (error) return error;

    const { id: groupId } = await params;
    const targetUserId = request.nextUrl.searchParams.get("userId");
    if (!targetUserId) {
      return jsonError("userId query required", "VALIDATION_ERROR", 400);
    }

    const group = await prisma.squadGroup.findFirst({
      where: {
        id: groupId,
        OR: [{ createdById: user!.id }, { members: { some: { userId: user!.id } } }],
      },
    });
    if (!group) {
      return jsonError("Group not found", "NOT_FOUND", 404);
    }

    if (targetUserId !== user!.id && group.createdById !== user!.id) {
      return jsonError("Forbidden", "FORBIDDEN", 403);
    }

    if (targetUserId === group.createdById) {
      return jsonError("Host cannot leave without deleting the group", "BAD_REQUEST", 400);
    }

    await prisma.squadGroupMember.deleteMany({
      where: { groupId, userId: targetUserId },
    });

    const updated = await prisma.squadGroup.findUniqueOrThrow({
      where: { id: groupId },
      include: {
        members: { include: { user: { select: { id: true, name: true, image: true } } } },
      },
    });

    return NextResponse.json({ group: updated });
  } catch (err) {
    return handleApiError(err);
  }
}
