import { NextRequest, NextResponse } from "next/server";
import { requireSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { requireEventHost, eventInclude } from "@/lib/event-access";
import { handleApiError, jsonError } from "@/lib/api-response";

type Params = { params: Promise<{ id: string; proposalId: string }> };

export async function DELETE(_request: NextRequest, { params }: Params) {
  try {
    const { user, error } = await requireSession();
    if (error) return error;

    const { id: eventId, proposalId } = await params;
    const hostCheck = await requireEventHost(eventId, user!.id);
    if (hostCheck.error) return hostCheck.error;

    if (hostCheck.event!.phase !== "scheduling") {
      return jsonError("Can only delete proposals during scheduling", "BAD_REQUEST", 400);
    }

    const proposal = await prisma.eventTimeProposal.findFirst({
      where: { id: proposalId, eventId },
    });
    if (!proposal) {
      return jsonError("Proposal not found", "NOT_FOUND", 404);
    }

    await prisma.eventTimeProposal.delete({ where: { id: proposalId } });

    const event = await prisma.event.findUnique({
      where: { id: eventId },
      include: eventInclude,
    });

    return NextResponse.json({ event });
  } catch (err) {
    return handleApiError(err);
  }
}
