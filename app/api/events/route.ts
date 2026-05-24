import { NextRequest, NextResponse } from "next/server";
import { logActivity } from "@/lib/activity";
import { requireSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { handleApiError, jsonError } from "@/lib/api-response";
import { findUsersFreeDuring } from "@/lib/event-availability";
import { maybeAutoArchiveCompletedEvents } from "@/lib/event-archive-scheduler";
import { eventListAccessWhere } from "@/lib/event-archive";
import { eventInclude, eventListInclude } from "@/lib/event-access";
import { loadScheduledEventRanges } from "@/lib/events-list-data";
import { checkUserWriteRateLimit } from "@/lib/user-rate-limit";
import { eventCreateSchema } from "@/lib/validations";

export async function GET(request: NextRequest) {
  try {
    const { user, error } = await requireSession();
    if (error) return error;

    const archivedOnly =
      request.nextUrl.searchParams.get("archived") === "true";

    if (request.nextUrl.searchParams.get("ranges") === "1") {
      const events = await loadScheduledEventRanges(user!.id);
      return NextResponse.json({ events });
    }

    await maybeAutoArchiveCompletedEvents();

    const events = await prisma.event.findMany({
      where: {
        ...eventListAccessWhere(user!.id),
        archivedAt: archivedOnly ? { not: null } : null,
      },
      include: eventListInclude,
      orderBy: archivedOnly
        ? [{ archivedAt: "desc" }]
        : [{ phase: "asc" }, { start: "asc" }, { updatedAt: "desc" }],
    });

    return NextResponse.json({
      events: events.map((e) => ({
        ...e,
        start: e.start?.toISOString() ?? null,
        end: e.end?.toISOString() ?? null,
        proposals: e.proposals.map((p) => ({ id: p.id })),
      })),
    });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function POST(request: NextRequest) {
  try {
    const { user, error } = await requireSession();
    if (error) return error;

    const rateLimited = await checkUserWriteRateLimit(
      user!.id,
      "event-create",
      20,
    );
    if (rateLimited) return rateLimited;

    const body = eventCreateSchema.parse(await request.json());
    const participantIds = body.participantUserIds ?? [];
    const phase = body.phase ?? "interest";
    const isScheduled = phase === "scheduled";

    if (body.templateId) {
      const tpl = await prisma.campaignTemplate.findFirst({
        where: { id: body.templateId, createdById: user!.id },
      });
      if (!tpl) {
        return jsonError("Template not found", "NOT_FOUND", 404);
      }
    }

    const event = await prisma.event.create({
      data: {
        title: body.title,
        description: body.description,
        phase,
        start: isScheduled && body.start ? new Date(body.start) : null,
        end: isScheduled && body.end ? new Date(body.end) : null,
        visibility: body.visibility,
        maxParticipants: body.maxParticipants ?? null,
        createdById: user!.id,
        templateId: body.templateId ?? undefined,
        participants: {
          create: [
            {
              userId: user!.id,
              status: isScheduled ? "accepted" : "interested",
            },
            ...participantIds
              .filter((id) => id !== user!.id)
              .map((userId) => ({
                userId,
                status: isScheduled ? "pending" : "interested",
              })),
          ],
        },
      },
      include: eventInclude,
    });

    let notifyTargets: Awaited<ReturnType<typeof findUsersFreeDuring>> = [];
    if (isScheduled && event.start && event.end) {
      notifyTargets = await findUsersFreeDuring(event.start, event.end);
    }

    await logActivity({
      type: "event.created",
      actorId: user!.id,
      entityType: "event",
      entityId: event.id,
      metadata: { phase: event.phase },
    });

    return NextResponse.json({ event, notifyTargets }, { status: 201 });
  } catch (err) {
    return handleApiError(err);
  }
}
