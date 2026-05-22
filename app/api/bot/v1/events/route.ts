import { NextRequest, NextResponse } from "next/server";
import { verifyBotAuth } from "@/lib/bot-auth";
import { getUserByDiscordId } from "@/lib/bot-user";
import { prisma } from "@/lib/db";
import { handleApiError } from "@/lib/api-response";
import { findUsersFreeDuring } from "@/lib/event-availability";
import { eventInclude } from "@/lib/event-access";
import { botEventCreateSchema } from "@/lib/validations";

export async function POST(request: NextRequest) {
  const authError = verifyBotAuth(request);
  if (authError) return authError;

  try {
    const body = botEventCreateSchema.parse(await request.json());
    const { user, error } = await getUserByDiscordId(body.discordId);
    if (error) return error;

    const participantDiscordIds = body.participantDiscordIds ?? [];
    const participants = await prisma.user.findMany({
      where: { discordId: { in: participantDiscordIds } },
    });

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
            ...participants
              .filter((p) => p.id !== user!.id)
              .map((p) => ({ userId: p.id, status: "pending" })),
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
