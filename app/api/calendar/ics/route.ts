import { NextResponse } from "next/server";
import { requireSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { handleApiError } from "@/lib/api-response";
import { ensureUserCalendarToken } from "@/lib/calendar-token";
import { buildGoogleCalendarIcsFeed } from "@/lib/calendar-ics";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const { user, error } = await requireSession();
    if (error) return error;

    await ensureUserCalendarToken(user!.id);

    const events = await prisma.event.findMany({
      where: {
        phase: "scheduled",
        archivedAt: null,
        start: { not: null },
        end: { not: null },
        OR: [
          { createdById: user!.id },
          {
            participants: {
              some: {
                userId: user!.id,
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
