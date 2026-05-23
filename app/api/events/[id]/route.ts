import { NextRequest, NextResponse } from "next/server";
import { logActivity } from "@/lib/activity";
import { requireSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { handleApiError, jsonError } from "@/lib/api-response";
import { findUsersFreeDuring } from "@/lib/event-availability";
import { getEventForUser, requireEventHost, eventInclude } from "@/lib/event-access";
import { canManuallyArchiveEvent } from "@/lib/event-archive";
import { serializeEventDetail } from "@/lib/serialize-event-detail";
import { eventUpdateSchema } from "@/lib/validations";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, { params }: Params) {
  try {
    const { user, error } = await requireSession();
    if (error) return error;

    const { id } = await params;
    const event = await getEventForUser(id, user!.id);
    if (!event) {
      return jsonError("Event not found", "NOT_FOUND", 404);
    }

    let notifyTargets: Awaited<ReturnType<typeof findUsersFreeDuring>> = [];
    if (event.phase === "scheduled" && event.start && event.end) {
      notifyTargets = await findUsersFreeDuring(event.start, event.end);
    }

    return NextResponse.json({
      event: serializeEventDetail(event),
      notifyTargets,
    });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function PATCH(request: NextRequest, { params }: Params) {
  try {
    const { user, error } = await requireSession();
    if (error) return error;

    const { id } = await params;
    const hostCheck = await requireEventHost(id, user!.id);
    if (hostCheck.error) return hostCheck.error;

    const body = eventUpdateSchema.parse(await request.json());

    let seasonConnect:
      | { connect: { id: string } }
      | { disconnect: true }
      | undefined;
    if (body.seasonId !== undefined) {
      if (body.seasonId === null) {
        seasonConnect = { disconnect: true };
      } else {
        const season = await prisma.season.findUnique({
          where: { id: body.seasonId },
        });
        if (!season) {
          return jsonError("Season not found", "NOT_FOUND", 404);
        }
        const eventGuildId = hostCheck.event!.guildId ?? null;
        if (eventGuildId && season.guildId !== eventGuildId) {
          return jsonError("Season belongs to a different guild", "BAD_REQUEST", 400);
        }
        if (!eventGuildId) {
          await prisma.event.update({
            where: { id },
            data: { guildId: season.guildId },
          });
        }
        seasonConnect = { connect: { id: body.seasonId } };
      }
    }

    if (body.archived === true) {
      const current = hostCheck.event!;
      if (!canManuallyArchiveEvent(current)) {
        return jsonError(
          "Pinned events can only be archived after the trip has ended",
          "BAD_REQUEST",
          400,
        );
      }
    }

    const archiveData =
      body.archived === true
        ? { archivedAt: new Date() }
        : body.archived === false
          ? { archivedAt: null }
          : {};

    const event = await prisma.event.update({
      where: { id },
      data: {
        title: body.title ?? undefined,
        description: body.description === undefined ? undefined : body.description,
        start: body.start ? new Date(body.start) : undefined,
        end: body.end ? new Date(body.end) : undefined,
        visibility: body.visibility ?? undefined,
        maxParticipants: body.maxParticipants ?? undefined,
        costCurrency: body.costCurrency ?? undefined,
        costSplitEvenly: body.costSplitEvenly ?? undefined,
        season: seasonConnect,
        ...archiveData,
      },
      include: eventInclude,
    });

    if (body.archived === true) {
      await logActivity({
        type: "event.archived",
        actorId: user!.id,
        entityType: "event",
        entityId: id,
      });
    }

    let notifyTargets: Awaited<ReturnType<typeof findUsersFreeDuring>> = [];
    if (event.start && event.end) {
      notifyTargets = await findUsersFreeDuring(event.start, event.end);
    }

    return NextResponse.json({
      event: serializeEventDetail(event),
      notifyTargets,
    });
  } catch (err) {
    return handleApiError(err);
  }
}
