import { NextRequest, NextResponse } from "next/server";
import { requireSession } from "@/lib/auth";
import { handleApiError, jsonError } from "@/lib/api-response";
import { parseRangeParams } from "@/lib/dates";
import { prisma } from "@/lib/db";
import { toCalendarBlocks } from "@/lib/calendar";
import { findSquadOverlaps } from "@/lib/overlaps";

export async function GET(request: NextRequest) {
  try {
    const { user, error } = await requireSession();
    if (error) return error;

    const { searchParams } = request.nextUrl;
    const { from, to } = parseRangeParams(
      searchParams.get("from"),
      searchParams.get("to"),
    );

    const groupId = searchParams.get("groupId");
    let userIds: string[] | undefined;
    if (groupId) {
      const group = await prisma.squadGroup.findFirst({
        where: {
          id: groupId,
          OR: [
            { createdById: user!.id },
            { members: { some: { userId: user!.id } } },
          ],
        },
        include: { members: { select: { userId: true } } },
      });
      if (!group) {
        return jsonError("Group not found", "NOT_FOUND", 404);
      }
      userIds = group.members.map((m) => m.userId);
    }

    const blocks = await prisma.availabilityBlock.findMany({
      where: {
        start: { lt: to },
        end: { gt: from },
        status: "free",
        ...(userIds && userIds.length > 0 ? { userId: { in: userIds } } : {}),
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
