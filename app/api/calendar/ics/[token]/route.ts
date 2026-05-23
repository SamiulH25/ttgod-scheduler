import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { handleApiError, jsonError } from "@/lib/api-response";
import { findUserByCalendarToken } from "@/lib/calendar-token";
import { buildGoogleCalendarIcsFeed } from "@/lib/calendar-ics";

type Params = { params: Promise<{ token: string }> };

export const dynamic = "force-dynamic";

export async function GET(_request: NextRequest, { params }: Params) {
  try {
    const { token } = await params;
    const u = await findUserByCalendarToken(token);
    if (!u) {
      return jsonError("Invalid calendar link", "NOT_FOUND", 404);
    }

    const events = await prisma.event.findMany({
      where: {
        phase: "scheduled",
        archivedAt: null,
        start: { not: null },
        end: { not: null },
        OR: [
          { createdById: u.id },
          {
            participants: {
              some: {
                userId: u.id,
                status: { in: ["accepted", "pending"] },
              },
            },
          },
        ],
      },
      select: {
        id: true,
        title: true,
        description: true,
        start: true,
        end: true,
      },
      orderBy: { start: "asc" },
    });

    const ics = buildGoogleCalendarIcsFeed({
      calendarName: "TTGOD — my events",
      events: events.map((e) => ({
        uid: `event-${e.id}@ttgod-scheduler`,
        title: e.title,
        description: e.description,
        start: e.start!,
        end: e.end!,
      })),
    });

    return new NextResponse(ics, {
      status: 200,
      headers: {
        "Content-Type": "text/calendar; charset=utf-8",
        "Cache-Control": "no-store",
      },
    });
  } catch (err) {
    return handleApiError(err);
  }
}
