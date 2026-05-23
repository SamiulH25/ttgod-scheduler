import { NextRequest, NextResponse } from "next/server";
import { requireSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { handleApiError, jsonError } from "@/lib/api-response";
import {
  getEventForUser,
  requireEventHost,
  eventInclude,
} from "@/lib/event-access";
import { canEditExpenses } from "@/lib/event-expenses";
import { expenseCreateSchema } from "@/lib/validations";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, { params }: Params) {
  try {
    const { user, error } = await requireSession();
    if (error) return error;

    const { id: eventId } = await params;
    const event = await getEventForUser(eventId, user!.id);
    if (!event) {
      return jsonError("Event not found", "NOT_FOUND", 404);
    }

    return NextResponse.json({ expenses: event.expenses });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function POST(request: NextRequest, { params }: Params) {
  try {
    const { user, error } = await requireSession();
    if (error) return error;

    const { id: eventId } = await params;
    const hostCheck = await requireEventHost(eventId, user!.id);
    if (hostCheck.error) return hostCheck.error;

    const event = hostCheck.event!;
    if (!canEditExpenses(event.phase)) {
      return jsonError(
        "Expenses can be added after the poll opens",
        "BAD_REQUEST",
        400,
      );
    }

    const body = expenseCreateSchema.parse(await request.json());
    const maxOrder = await prisma.eventExpense.aggregate({
      where: { eventId },
      _max: { sortOrder: true },
    });
    const sortOrder = (maxOrder._max.sortOrder ?? -1) + 1;

    const expense = await prisma.eventExpense.create({
      data: {
        eventId,
        label: body.label,
        amountCents: body.amountCents,
        sortOrder,
        createdById: user!.id,
        ...(body.paidById !== undefined && { paidById: body.paidById }),
        ...(body.splits !== undefined && { splits: body.splits }),
      },
    });

    const full = await prisma.event.findUnique({
      where: { id: eventId },
      include: eventInclude,
    });

    return NextResponse.json({ expense, event: full }, { status: 201 });
  } catch (err) {
    return handleApiError(err);
  }
}
