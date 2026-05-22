import { NextRequest, NextResponse } from "next/server";
import { requireSession } from "@/lib/auth";
import { handleApiError } from "@/lib/api-response";
import { parseRangeParams } from "@/lib/dates";
import { prisma } from "@/lib/db";
import { toCalendarBlocks } from "@/lib/calendar";
import { findSquadOverlaps } from "@/lib/overlaps";

export async function GET(request: NextRequest) {
  try {
    const { error } = await requireSession();
    if (error) return error;

    const { searchParams } = request.nextUrl;
    const { from, to } = parseRangeParams(
      searchParams.get("from"),
      searchParams.get("to"),
    );

    const blocks = await prisma.availabilityBlock.findMany({
      where: {
        start: { lt: to },
        end: { gt: from },
      },
      include: {
        user: { select: { id: true, name: true, image: true } },
      },
    });

    const overlaps = findSquadOverlaps(toCalendarBlocks(blocks), from, to);

    return NextResponse.json({ overlaps });
  } catch (err) {
    return handleApiError(err);
  }
}
