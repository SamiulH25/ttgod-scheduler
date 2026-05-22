import { NextRequest, NextResponse } from "next/server";
import { verifyBotAuth } from "@/lib/bot-auth";
import { prisma } from "@/lib/db";
import { handleApiError, jsonError } from "@/lib/api-response";
import { findUsersFreeDuring } from "@/lib/event-availability";
import { eventInclude } from "@/lib/event-access";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, { params }: Params) {
  const authError = verifyBotAuth(_request);
  if (authError) return authError;

  try {
    const { id } = await params;
    const event = await prisma.event.findUnique({
      where: { id },
      include: eventInclude,
    });

    if (!event) {
      return jsonError("Event not found", "NOT_FOUND", 404);
    }

    const notifyTargets = await findUsersFreeDuring(event.start, event.end);

    return NextResponse.json({ event, notifyTargets });
  } catch (err) {
    return handleApiError(err);
  }
}
