import { NextRequest, NextResponse } from "next/server";
import { requireSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { handleApiError } from "@/lib/api-response";
import { parseRangeParams } from "@/lib/dates";
import { findUsersFreeDuring } from "@/lib/event-availability";
import { eventInclude } from "@/lib/event-access";
import { eventCreateSchema } from "@/lib/validations";

export async function GET(request: NextRequest) {
  try {
    const { user, error } = await requireSession();
    if (error) return error;

    const { searchParams } = request.nextUrl;
    const { from, to } = parseRangeParams(
      searchParams.get("from"),
      searchParams.get("to"),
    );

    const events = await prisma.event.findMany({
      where: {
        OR: [
          { createdById: user!.id },
          { participants: { some: { userId: user!.id } } },
        ],
        start: { lt: to },
        end: { gt: from },
      },
      include: {
        createdBy: {
          select: { id: true, name: true, image: true, discordId: true },
        },
        participants: {
          include: {
            user: { select: { id: true, name: true, image: true, discordId: true } },
          },
        },
      },
      orderBy: { start: "asc" },
    });

    return NextResponse.json({ events });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function POST(request: NextRequest) {
  try {
    const { user, error } = await requireSession();
    if (error) return error;

    const body = eventCreateSchema.parse(await request.json());
    const participantIds = body.participantUserIds ?? [];

    const event = await prisma.event.create({
      data: {
        title: body.title,
        description: body.description,
        start: new Date(body.start),
        end: new Date(body.end),
        visibility: body.visibility,
        createdById: user!.id,
        participants: {
          create: [
            { userId: user!.id, status: "accepted" },
            ...participantIds
              .filter((id) => id !== user!.id)
              .map((userId) => ({ userId, status: "pending" })),
          ],
        },
      },
      include: eventInclude,
    });

    const notifyTargets = await findUsersFreeDuring(
      event.start,
      event.end,
    );

    return NextResponse.json({ event, notifyTargets }, { status: 201 });
  } catch (err) {
    return handleApiError(err);
  }
}
