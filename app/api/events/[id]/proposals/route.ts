import { NextRequest, NextResponse } from "next/server";
import { requireSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { requireEventHost, eventInclude } from "@/lib/event-access";
import { handleApiError, jsonError } from "@/lib/api-response";
import { proposalCreateSchema } from "@/lib/validations";

type Params = { params: Promise<{ id: string }> };

export async function POST(request: NextRequest, { params }: Params) {
  try {
    const { user, error } = await requireSession();
    if (error) return error;

    const { id: eventId } = await params;
    const hostCheck = await requireEventHost(eventId, user!.id);
    if (hostCheck.error) return hostCheck.error;

    const event = hostCheck.event!;
    if (event.phase !== "scheduling") {
      return jsonError("Proposals only during scheduling phase", "BAD_REQUEST", 400);
    }

    const body = proposalCreateSchema.parse(await request.json());

    const proposal = await prisma.eventTimeProposal.create({
      data: {
        eventId,
        start: new Date(body.start),
        end: new Date(body.end),
        createdById: user!.id,
      },
      include: {
        createdBy: { select: { id: true, name: true, image: true } },
        votes: { select: { userId: true, rank: true } },
      },
    });

    const full = await prisma.event.findUnique({
      where: { id: eventId },
      include: eventInclude,
    });

    return NextResponse.json({ proposal, event: full }, { status: 201 });
  } catch (err) {
    return handleApiError(err);
  }
}
