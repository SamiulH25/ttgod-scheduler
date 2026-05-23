import { NextRequest, NextResponse } from "next/server";
import { requireSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { handleApiError } from "@/lib/api-response";
import { availabilityCopyWeekSchema } from "@/lib/validations";
import { addUtcDays, shiftBlockToWeek, utcStartOfIsoWeek } from "@/lib/recurrence";

export async function POST(request: NextRequest) {
  try {
    const { user, error } = await requireSession();
    if (error) return error;

    const body = availabilityCopyWeekSchema.parse(await request.json());
    const sourceWeekStart = utcStartOfIsoWeek(new Date(body.sourceWeekStart));
    const targetWeekStart = utcStartOfIsoWeek(new Date(body.targetWeekStart));
    const sourceWeekEnd = addUtcDays(sourceWeekStart, 7);

    const existing = await prisma.availabilityBlock.findMany({
      where: {
        userId: user!.id,
        start: { lt: sourceWeekEnd },
        end: { gt: sourceWeekStart },
      },
    });

    if (existing.length === 0) {
      return NextResponse.json({ created: [] });
    }

    const created = await prisma.$transaction(async (tx) => {
      const rows: Awaited<ReturnType<typeof tx.availabilityBlock.create>>[] = [];
      for (const b of existing) {
        const shifted = shiftBlockToWeek(b.start, b.end, sourceWeekStart, targetWeekStart);
        const row = await tx.availabilityBlock.create({
          data: {
            userId: user!.id,
            start: shifted.start,
            end: shifted.end,
            label: b.label,
            status: b.status,
            recurrenceRule: b.recurrenceRule,
            seriesId: b.seriesId,
          },
        });
        rows.push(row);
      }
      return rows;
    });

    return NextResponse.json({ created }, { status: 201 });
  } catch (err) {
    return handleApiError(err);
  }
}
