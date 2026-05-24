import { NextRequest, NextResponse } from "next/server";
import { verifyBotAuth } from "@/lib/bot-auth";
import { getUserByDiscordId } from "@/lib/bot-user";
import { prisma } from "@/lib/db";
import { handleApiError } from "@/lib/api-response";
import { parseRangeParams } from "@/lib/dates";
import { rangeQuerySchema } from "@/lib/validations";

type Params = { params: Promise<{ discordId: string }> };

export async function GET(request: NextRequest, { params }: Params) {
  const authError = await verifyBotAuth(request);
  if (authError) return authError;

  try {
    const { discordId } = await params;
    const { user, error } = await getUserByDiscordId(discordId);
    if (error) return error;

    const { searchParams } = request.nextUrl;
    rangeQuerySchema.parse({
      from: searchParams.get("from") ?? undefined,
      to: searchParams.get("to") ?? undefined,
    });

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
        participants: {
          include: {
            user: { select: { discordId: true, name: true } },
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
