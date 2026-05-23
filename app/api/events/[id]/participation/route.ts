import { NextRequest, NextResponse } from "next/server";
import { requireSession } from "@/lib/auth";
import { canAddParticipant } from "@/lib/campaign-capacity";
import { prisma } from "@/lib/db";
import { getEventForUser } from "@/lib/event-access";
import { handleApiError, jsonError } from "@/lib/api-response";
import { participationPatchSchema } from "@/lib/validations";
import {
  assignWaitlistPosition,
  normalizeWaitlistPositions,
  promoteNextFromWaitlist,
} from "@/lib/waitlist";
import { promoteNextBackupParticipant } from "@/lib/promote-backup";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(request: NextRequest, { params }: Params) {
  try {
    const { user, error } = await requireSession();
    if (error) return error;

    const { id: eventId } = await params;
    const body = participationPatchSchema.parse(await request.json());
    const { status, roleId, isBackup, targetUserId } = body;

    const event = await getEventForUser(eventId, user!.id);
    if (!event) {
      return jsonError("Event not found", "NOT_FOUND", 404);
    }

    const isHost = event.createdById === user!.id;
    const subjectUserId = targetUserId ?? user!.id;

    if (subjectUserId !== user!.id && !isHost) {
      return jsonError("Only the host can update other members", "FORBIDDEN", 403);
    }

    if (isBackup !== undefined && subjectUserId !== user!.id && !isHost) {
      return jsonError("Only the host can set bench flags for others", "FORBIDDEN", 403);
    }

    const interestStatuses = ["interested", "not_interested"] as const;
    const inviteStatuses = ["accepted", "declined", "pending"] as const;
    const openCampaign = event.phase === "interest" || event.phase === "scheduling";

    if (openCampaign) {
      if (!interestStatuses.includes(status as (typeof interestStatuses)[number])) {
        return jsonError(
          "Use interested or not_interested while the campaign is open",
          "BAD_REQUEST",
          400,
        );
      }
    } else if (!inviteStatuses.includes(status as (typeof inviteStatuses)[number])) {
      return jsonError(
        "Use accepted, declined, or pending for scheduled events",
        "BAD_REQUEST",
        400,
      );
    }

    const existing = event.participants.find((p) => p.userId === subjectUserId);
    const wasInterested =
      existing?.status === "interested" && existing.waitlistPosition == null;
    const wasWaitlisted =
      existing?.status === "interested" && existing.waitlistPosition != null;
    const wasAccepted = existing?.status === "accepted";

    if (roleId !== undefined && roleId !== null) {
      const role = await prisma.eventRole.findFirst({
        where: { id: roleId, eventId },
      });
      if (!role) {
        return jsonError("Role not found on this event", "NOT_FOUND", 404);
      }
      if (role.maxCount != null && status === "accepted") {
        const used = await prisma.eventParticipant.count({
          where: {
            eventId,
            roleId,
            status: "accepted",
            userId: { not: subjectUserId },
          },
        });
        if (used >= role.maxCount) {
          return jsonError("That role is full", "BAD_REQUEST", 400);
        }
      }
    }

    if (status === "interested" && !isHost && subjectUserId === user!.id) {
      const alreadyInterested = existing?.status === "interested";
      if (!alreadyInterested) {
        const others = event.participants.filter((p) => p.userId !== subjectUserId);
        const atCap = !canAddParticipant(
          event.phase,
          others,
          event.maxParticipants,
          1,
        );
        if (atCap) {
          const participation = await prisma.eventParticipant.upsert({
            where: { eventId_userId: { eventId, userId: subjectUserId } },
            create: { eventId, userId: subjectUserId, status: "interested" },
            update: { status: "interested" },
          });
          await assignWaitlistPosition(eventId, participation.id);
          const refreshed = await prisma.eventParticipant.findUnique({
            where: { id: participation.id },
          });
          return NextResponse.json({ participation: refreshed });
        }
      }
    }

    const updateData: {
      status: string;
      waitlistPosition?: number | null;
      roleId?: string | null;
      isBackup?: boolean;
    } = { status };

    if (roleId !== undefined) {
      updateData.roleId = roleId;
    }
    if (isBackup !== undefined) {
      updateData.isBackup = isBackup;
    }

    if (status !== "interested") {
      updateData.waitlistPosition = null;
    } else if (!(existing?.status === "interested" && existing.waitlistPosition != null)) {
      updateData.waitlistPosition = null;
    }

    const participation = await prisma.eventParticipant.upsert({
      where: { eventId_userId: { eventId, userId: subjectUserId } },
      create: {
        eventId,
        userId: subjectUserId,
        status,
        waitlistPosition: null,
        ...(roleId !== undefined ? { roleId } : {}),
        isBackup: isBackup ?? false,
      },
      update: updateData,
    });

    if (
      openCampaign &&
      status === "not_interested" &&
      (wasInterested || wasWaitlisted) &&
      subjectUserId === user!.id
    ) {
      if (wasInterested) {
        await promoteNextFromWaitlist(eventId);
      } else {
        await normalizeWaitlistPositions(eventId);
      }
    }

    if (
      !openCampaign &&
      wasAccepted &&
      status === "declined"
    ) {
      await promoteNextBackupParticipant(eventId);
    }

    const refreshed = await prisma.eventParticipant.findUnique({
      where: { id: participation.id },
    });

    return NextResponse.json({ participation: refreshed });
  } catch (err) {
    return handleApiError(err);
  }
}
