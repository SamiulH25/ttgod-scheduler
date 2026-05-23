import { NextRequest, NextResponse } from "next/server";
import { requireSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { handleApiError } from "@/lib/api-response";
import { squadGroupCreateSchema } from "@/lib/validations";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const { user, error } = await requireSession();
    if (error) return error;

    const groups = await prisma.squadGroup.findMany({
      where: {
        OR: [
          { createdById: user!.id },
          { members: { some: { userId: user!.id } } },
        ],
      },
      include: {
        members: { include: { user: { select: { id: true, name: true, image: true } } } },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ groups });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function POST(request: NextRequest) {
  try {
    const { user, error } = await requireSession();
    if (error) return error;

    const body = squadGroupCreateSchema.parse(await request.json());

    const group = await prisma.$transaction(async (tx) => {
      const g = await tx.squadGroup.create({
        data: { name: body.name, createdById: user!.id },
      });
      await tx.squadGroupMember.create({
        data: { groupId: g.id, userId: user!.id },
      });
      const extra = [...new Set((body.memberUserIds ?? []).filter((id) => id !== user!.id))];
      if (extra.length > 0) {
        const existing = await tx.squadGroupMember.findMany({
          where: { groupId: g.id, userId: { in: extra } },
          select: { userId: true },
        });
        const have = new Set(existing.map((m) => m.userId));
        const toAdd = extra.filter((uid) => !have.has(uid));
        if (toAdd.length > 0) {
          await tx.squadGroupMember.createMany({
            data: toAdd.map((uid) => ({ groupId: g.id, userId: uid })),
          });
        }
      }
      return tx.squadGroup.findUniqueOrThrow({
        where: { id: g.id },
        include: {
          members: { include: { user: { select: { id: true, name: true, image: true } } } },
        },
      });
    });

    return NextResponse.json({ group }, { status: 201 });
  } catch (err) {
    return handleApiError(err);
  }
}
