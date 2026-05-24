import { NextRequest, NextResponse } from "next/server";
import { verifyBotAuth } from "@/lib/bot-auth";
import { prisma } from "@/lib/db";
import { handleApiError, jsonError } from "@/lib/api-response";
import { eventInclude } from "@/lib/event-access";
import { botParticipantsAddSchema } from "@/lib/validations";

type Params = { params: Promise<{ id: string }> };

export async function POST(request: NextRequest, { params }: Params) {
  const authError = await verifyBotAuth(request);
  if (authError) return authError;

  try {
    const { id: eventId } = await params;
    const event = await prisma.event.findUnique({ where: { id: eventId } });
    if (!event) {
      return jsonError("Event not found", "NOT_FOUND", 404);
    }

    const { discordIds } = botParticipantsAddSchema.parse(await request.json());
    const users = await prisma.user.findMany({
      where: { discordId: { in: discordIds } },
    });

    const existing = await prisma.eventParticipant.findMany({
      where: { eventId },
      select: { userId: true },
    });
    const existingIds = new Set(existing.map((p) => p.userId));

    const toAdd = users.filter(
      (u) => u.id !== event.createdById && !existingIds.has(u.id),
    );
    if (toAdd.length > 0) {
      await prisma.eventParticipant.createMany({
        data: toAdd.map((u) => ({
          eventId,
          userId: u.id,
          status: "pending",
        })),
      });
    }

    const updated = await prisma.event.findUnique({
      where: { id: eventId },
      include: eventInclude,
    });

    return NextResponse.json({ event: updated });
  } catch (err) {
    return handleApiError(err);
  }
}
