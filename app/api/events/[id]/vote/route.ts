import { NextRequest, NextResponse } from "next/server";

import { requireSession } from "@/lib/auth";

import { prisma } from "@/lib/db";

import { getEventForUser, eventInclude } from "@/lib/event-access";

import { handleApiError, jsonError } from "@/lib/api-response";

import { voteSchema } from "@/lib/validations";



type Params = { params: Promise<{ id: string }> };



export async function PUT(request: NextRequest, { params }: Params) {

  try {

    const { user, error } = await requireSession();

    if (error) return error;



    const { id: eventId } = await params;

    const body = voteSchema.parse(await request.json());

    const proposalIds =

      "proposalIds" in body ? body.proposalIds : [body.proposalId];



    const event = await getEventForUser(eventId, user!.id);

    if (!event) {

      return jsonError("Event not found", "NOT_FOUND", 404);

    }

    if (event.phase !== "scheduling") {

      return jsonError("Voting only during scheduling phase", "BAD_REQUEST", 400);

    }



    const uniqueIds = [...new Set(proposalIds)];

    if (uniqueIds.length !== proposalIds.length) {

      return jsonError("Duplicate proposal ids", "BAD_REQUEST", 400);

    }



    const found = await prisma.eventTimeProposal.findMany({

      where: { eventId, id: { in: uniqueIds } },

      select: { id: true },

    });

    if (found.length !== uniqueIds.length) {

      return jsonError("Proposal not found", "NOT_FOUND", 404);

    }



    await prisma.$transaction(async (tx) => {

      await tx.eventProposalVote.deleteMany({

        where: { eventId, userId: user!.id },

      });

      if (uniqueIds.length === 0) return;

      await tx.eventProposalVote.createMany({

        data: uniqueIds.map((proposalId, i) => ({

          eventId,

          proposalId,

          userId: user!.id,

          rank: i + 1,

        })),

      });

    });



    const updated = await prisma.event.findUnique({

      where: { id: eventId },

      include: eventInclude,

    });



    return NextResponse.json({ event: updated });

  } catch (err) {

    return handleApiError(err);

  }

}

