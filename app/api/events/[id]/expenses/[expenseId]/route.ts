import { NextRequest, NextResponse } from "next/server";
import { requireSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { handleApiError, jsonError } from "@/lib/api-response";
import { requireEventHost, eventInclude } from "@/lib/event-access";
import { canEditExpenses } from "@/lib/event-expenses";
import { expenseUpdateSchema } from "@/lib/validations";

type Params = { params: Promise<{ id: string; expenseId: string }> };

export async function PATCH(request: NextRequest, { params }: Params) {
  try {
    const { user, error } = await requireSession();
    if (error) return error;

    const { id: eventId, expenseId } = await params;
    const hostCheck = await requireEventHost(eventId, user!.id);
    if (hostCheck.error) return hostCheck.error;

    const event = hostCheck.event!;
    if (!canEditExpenses(event.phase)) {
      return jsonError(
        "Expenses can only be edited after the poll opens",
        "BAD_REQUEST",
        400,
      );
    }

    const existing = await prisma.eventExpense.findFirst({
      where: { id: expenseId, eventId },
    });
    if (!existing) {
      return jsonError("Expense not found", "NOT_FOUND", 404);
    }

    const body = expenseUpdateSchema.parse(await request.json());
    const expense = await prisma.eventExpense.update({
      where: { id: expenseId },
      data: {
        label: body.label ?? undefined,
        amountCents: body.amountCents ?? undefined,
        sortOrder: body.sortOrder ?? undefined,
        paidById: body.paidById === undefined ? undefined : body.paidById,
        splits: body.splits === undefined ? undefined : body.splits,
      },
    });

    const full = await prisma.event.findUnique({
      where: { id: eventId },
      include: eventInclude,
    });

    return NextResponse.json({ expense, event: full });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function DELETE(_request: NextRequest, { params }: Params) {
  try {
    const { user, error } = await requireSession();
    if (error) return error;

    const { id: eventId, expenseId } = await params;
    const hostCheck = await requireEventHost(eventId, user!.id);
    if (hostCheck.error) return hostCheck.error;

    const event = hostCheck.event!;
    if (!canEditExpenses(event.phase)) {
      return jsonError(
        "Expenses can only be edited after the poll opens",
        "BAD_REQUEST",
        400,
      );
    }

    const existing = await prisma.eventExpense.findFirst({
      where: { id: expenseId, eventId },
    });
    if (!existing) {
      return jsonError("Expense not found", "NOT_FOUND", 404);
    }

    await prisma.eventExpense.delete({ where: { id: expenseId } });

    const full = await prisma.event.findUnique({
      where: { id: eventId },
      include: eventInclude,
    });

    return NextResponse.json({ event: full });
  } catch (err) {
    return handleApiError(err);
  }
}
