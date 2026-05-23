import { NextRequest, NextResponse } from "next/server";
import { requireSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { handleApiError, jsonError } from "@/lib/api-response";
import { getEventForUser } from "@/lib/event-access";
import { z } from "zod";
import { summarizeAttendance } from "@/lib/attendance-stats";

type Params = { params: Promise<{ id: string }> };

function endedForAttendance(event: {
  phase: string;
  end: Date | null;
  archivedAt: Date | null;
}): boolean {
  if (event.archivedAt) return true;
  if (event.phase !== "scheduled" || !event.end) return false;
  return event.end < new Date();
}

const attendancePatchSchema = z.object({
  userId: z.string().min(1),
  status: z.enum(["unknown", "attended", "missed", "excused"]),
});

export async function GET(_request: NextRequest, { params }: Params) {
  try {
    const { user, error } = await requireSession();
    if (error) return error;

    const { id: eventId } = await params;
    const event = await getEventForUser(eventId, user!.id);
    if (!event) {
      return jsonError("Event not found", "NOT_FOUND", 404);
    }

    if (!endedForAttendance(event)) {
      return jsonError("Attendance is available after the session ends", "BAD_REQUEST", 400);
    }

    const rows = await prisma.eventAttendance.findMany({
      where: { eventId },
      include: {
        user: { select: { id: true, name: true, image: true } },
      },
      orderBy: { updatedAt: "desc" },
    });

    const stats = summarizeAttendance(rows.map((r) => ({ status: r.status })));

    return NextResponse.json({
      stats,
      attendances: rows.map((r) => ({
        id: r.id,
        userId: r.userId,
        status: r.status,
        user: r.user,
        updatedAt: r.updatedAt.toISOString(),
      })),
    });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function PATCH(request: NextRequest, { params }: Params) {
  try {
    const { user, error } = await requireSession();
    if (error) return error;

    const { id: eventId } = await params;
    const event = await getEventForUser(eventId, user!.id);
    if (!event) {
      return jsonError("Event not found", "NOT_FOUND", 404);
    }

    if (!endedForAttendance(event)) {
      return jsonError("Attendance can be recorded after the session ends", "BAD_REQUEST", 400);
    }

    const body = attendancePatchSchema.parse(await request.json());
    const isHost = event.createdById === user!.id;
    if (!isHost && body.userId !== user!.id) {
      return jsonError("Only the host can update other members", "FORBIDDEN", 403);
    }

    const participant = await prisma.eventParticipant.findFirst({
      where: { eventId, userId: body.userId },
    });
    if (!participant?.userId) {
      return jsonError("User is not a participant on this event", "BAD_REQUEST", 400);
    }

    const row = await prisma.eventAttendance.upsert({
      where: {
        eventId_userId: { eventId, userId: body.userId },
      },
      create: {
        eventId,
        userId: body.userId,
        status: body.status,
      },
      update: { status: body.status },
      include: {
        user: { select: { id: true, name: true, image: true } },
      },
    });

    const all = await prisma.eventAttendance.findMany({
      where: { eventId },
      include: {
        user: { select: { id: true, name: true, image: true } },
      },
    });
    const stats = summarizeAttendance(all.map((r) => ({ status: r.status })));

    return NextResponse.json({
      attendance: {
        id: row.id,
        userId: row.userId,
        status: row.status,
        user: row.user,
        updatedAt: row.updatedAt.toISOString(),
      },
      stats,
    });
  } catch (err) {
    return handleApiError(err);
  }
}
