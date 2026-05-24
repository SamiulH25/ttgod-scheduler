import { NextRequest, NextResponse } from "next/server";
import { requireSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getEventForUser } from "@/lib/event-access";
import { handleApiError, jsonError } from "@/lib/api-response";
import { parseRangeParams } from "@/lib/dates";
import {
  findFullRosterSlots,
  serializeRankedSlot,
} from "@/lib/scheduling/find-slots";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, { params }: Params) {
  try {
    const { user, error } = await requireSession();
    if (error) return error;

    const { id: eventId } = await params;
    const event = await getEventForUser(eventId, user!.id);
    if (!event || event.phase !== "scheduling") {
      return jsonError("Suggest only during scheduling", "BAD_REQUEST", 400);
    }

    const { searchParams } = request.nextUrl;
    const { from, to } = parseRangeParams(
      searchParams.get("from"),
      searchParams.get("to"),
    );
    const durationMinutes = Math.min(
      24 * 60,
      Math.max(15, parseInt(searchParams.get("durationMinutes") ?? "120", 10) || 120),
    );

    const userIds = [
      ...new Set(
        event.participants
          .filter(
            (p) =>
              p.userId &&
              p.status !== "not_interested" &&
              p.status !== "declined",
          )
          .map((p) => p.userId as string),
      ),
    ];

    if (userIds.length === 0) {
      return NextResponse.json({ slots: [] });
    }

    const blocks = await prisma.availabilityBlock.findMany({
      where: {
        userId: { in: userIds },
        start: { lt: to },
        end: { gt: from },
      },
      select: {
        userId: true,
        start: true,
        end: true,
        status: true,
      },
    });

    const slices = blocks.map((b) => ({
      userId: b.userId,
      start: b.start,
      end: b.end,
      status: b.status,
    }));

    const ranked = findFullRosterSlots(
      userIds,
      slices,
      from,
      to,
      durationMinutes,
      { limit: 12, minDurationMinutes: 30 },
    );

    return NextResponse.json({
      slots: ranked.map((s) => ({
        start: s.start.toISOString(),
        end: s.end.toISOString(),
      })),
      ranked: ranked.map(serializeRankedSlot),
    });
  } catch (err) {
    return handleApiError(err);
  }
}
