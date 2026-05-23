import { NextResponse } from "next/server";
import { requireSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { requireEventHost, eventInclude } from "@/lib/event-access";
import { handleApiError } from "@/lib/api-response";
import { promoteNextFromWaitlist } from "@/lib/waitlist";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string }> };

export async function POST(_req: Request, { params }: Params) {
  try {
    const { user, error } = await requireSession();
    if (error) return error;

    const { id: eventId } = await params;
    const hostCheck = await requireEventHost(eventId, user!.id);
    if (hostCheck.error) return hostCheck.error;

    await promoteNextFromWaitlist(eventId);

    const event = await prisma.event.findUnique({
      where: { id: eventId },
      include: eventInclude,
    });

    return NextResponse.json({ event });
  } catch (err) {
    return handleApiError(err);
  }
}
