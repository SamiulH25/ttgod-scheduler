import { NextRequest, NextResponse } from "next/server";
import { verifyBotAuth } from "@/lib/bot-auth";
import { prisma } from "@/lib/db";
import { handleApiError, jsonError } from "@/lib/api-response";
import { itineraryBulkSchema } from "@/lib/validations";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, { params }: Params) {
  const authError = verifyBotAuth(_request);
  if (authError) return authError;

  try {
    const { id: eventId } = await params;
    const event = await prisma.event.findUnique({ where: { id: eventId } });
    if (!event) {
      return jsonError("Event not found", "NOT_FOUND", 404);
    }

    const items = await prisma.eventPlanItem.findMany({
      where: { eventId },
      orderBy: { sortOrder: "asc" },
    });

    return NextResponse.json({ items });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function PUT(request: NextRequest, { params }: Params) {
  const authError = verifyBotAuth(request);
  if (authError) return authError;

  try {
    const { id: eventId } = await params;
    const event = await prisma.event.findUnique({ where: { id: eventId } });
    if (!event) {
      return jsonError("Event not found", "NOT_FOUND", 404);
    }

    const { items } = itineraryBulkSchema.parse(await request.json());

    await prisma.$transaction(async (tx) => {
      await tx.eventPlanItem.deleteMany({ where: { eventId } });
      if (items.length > 0) {
        await tx.eventPlanItem.createMany({
          data: items.map((item, index) => ({
            eventId,
            title: item.title,
            notes: item.notes,
            startsAt: item.startsAt ? new Date(item.startsAt) : null,
            sortOrder: item.sortOrder ?? index,
          })),
        });
      }
    });

    const saved = await prisma.eventPlanItem.findMany({
      where: { eventId },
      orderBy: { sortOrder: "asc" },
    });

    return NextResponse.json({ items: saved });
  } catch (err) {
    return handleApiError(err);
  }
}
