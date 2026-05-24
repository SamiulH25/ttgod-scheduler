import { NextRequest, NextResponse } from "next/server";
import { logActivity } from "@/lib/activity";
import { requireSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { computeCombinedOwnBlock } from "@/lib/availability";
import { handleApiError } from "@/lib/api-response";
import { parseRangeParams } from "@/lib/dates";
import { checkUserWriteRateLimit } from "@/lib/user-rate-limit";
import { availabilityCreateSchema } from "@/lib/validations";

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
        user: {
          select: { id: true, name: true, image: true },
        },
      },
      orderBy: { start: "asc" },
    });

    return NextResponse.json({ blocks });
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
      "availability-create",
      60,
    );
    if (rateLimited) return rateLimited;

    const body = availabilityCreateSchema.parse(await request.json());
    const start = new Date(body.start);
    const end = new Date(body.end);

    const existing = await prisma.availabilityBlock.findMany({
      where: { userId: user!.id },
    });

    const { overlapping, combinedStart, combinedEnd } = computeCombinedOwnBlock(
      existing,
      start,
      end,
    );

    const block =
      overlapping.length > 0
        ? await prisma.$transaction(async (tx) => {
            await tx.availabilityBlock.deleteMany({
              where: { id: { in: overlapping.map((b) => b.id) } },
            });
            return tx.availabilityBlock.create({
              data: {
                userId: user!.id,
                start: combinedStart,
                end: combinedEnd,
                label: body.label,
                status: body.status ?? "free",
                lfgNote: body.lfgNote ?? undefined,
                recurrenceRule: body.recurrenceRule ?? undefined,
                seriesId: body.seriesId ?? undefined,
              },
            });
          })
        : await prisma.availabilityBlock.create({
            data: {
              userId: user!.id,
              start,
              end,
              label: body.label,
              status: body.status ?? "free",
              lfgNote: body.lfgNote ?? undefined,
              recurrenceRule: body.recurrenceRule ?? undefined,
              seriesId: body.seriesId ?? undefined,
            },
          });

    await prisma.user.update({
      where: { id: user!.id },
      data: { onboardingCompleted: true },
    });

    await logActivity({
      type: "availability.created",
      actorId: user!.id,
      entityType: "availability_block",
      entityId: block.id,
      metadata: { merged: overlapping.length > 0 },
    });

    return NextResponse.json(
      { block, merged: overlapping.length > 0 },
      { status: 201 },
    );
  } catch (err) {
    return handleApiError(err);
  }
}
