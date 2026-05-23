import { NextRequest, NextResponse } from "next/server";
import { logActivity } from "@/lib/activity";
import { requireSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { requireEventHost, eventInclude } from "@/lib/event-access";
import { handleApiError, jsonError } from "@/lib/api-response";
import { serializeEventDetail } from "@/lib/serialize-event-detail";
import { phaseTransitionSchema } from "@/lib/validations";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(request: NextRequest, { params }: Params) {
  try {
    const { user, error } = await requireSession();
    if (error) return error;

    const { id } = await params;
    const hostCheck = await requireEventHost(id, user!.id);
    if (hostCheck.error) return hostCheck.error;

    const event = hostCheck.event!;
    const body = phaseTransitionSchema.parse(await request.json());

    if (body.action === "open_scheduling") {
      if (event.phase !== "interest") {
        return jsonError("Can only open scheduling from interest phase", "BAD_REQUEST", 400);
      }
      const updated = await prisma.event.update({
        where: { id },
        data: { phase: "scheduling" },
        include: eventInclude,
      });
      await logActivity({
        type: "event.phase_changed",
        actorId: user!.id,
        entityType: "event",
        entityId: id,
        metadata: { phase: "scheduling", action: "open_scheduling" },
      });
      return NextResponse.json({ event: serializeEventDetail(updated) });
    }

    if (body.action === "reopen_interest") {
      if (event.phase !== "scheduling") {
        return jsonError("Can only move back to interest from scheduling", "BAD_REQUEST", 400);
      }
      const updated = await prisma.event.update({
        where: { id },
        data: { phase: "interest" },
        include: eventInclude,
      });
      await logActivity({
        type: "event.phase_changed",
        actorId: user!.id,
        entityType: "event",
        entityId: id,
        metadata: { phase: "interest", action: "reopen_interest" },
      });
      return NextResponse.json({ event: serializeEventDetail(updated) });
    }

    if (body.action !== "finalize") {
      return jsonError("Unknown phase action", "BAD_REQUEST", 400);
    }

    if (event.phase !== "scheduling") {
      return jsonError("Can only finalize from scheduling phase", "BAD_REQUEST", 400);
    }

    const proposal = await prisma.eventTimeProposal.findFirst({
      where: { id: body.proposalId, eventId: id },
    });
    if (!proposal) {
      return jsonError("Proposal not found", "NOT_FOUND", 404);
    }

    await prisma.eventParticipant.updateMany({
      where: {
        eventId: id,
        userId: { not: event.createdById },
        status: { in: ["interested", "pending"] },
      },
      data: { status: "pending" },
    });

    await prisma.eventParticipant.update({
      where: {
        eventId_userId: { eventId: id, userId: event.createdById },
      },
      data: { status: "accepted" },
    });

    const updated = await prisma.event.update({
      where: { id },
      data: {
        phase: "scheduled",
        start: proposal.start,
        end: proposal.end,
        schedulingClosedAt: new Date(),
      },
      include: eventInclude,
    });

    await logActivity({
      type: "event.finalized",
      actorId: user!.id,
      entityType: "event",
      entityId: id,
      metadata: { proposalId: proposal.id },
    });

    return NextResponse.json({ event: serializeEventDetail(updated) });
  } catch (err) {
    return handleApiError(err);
  }
}
