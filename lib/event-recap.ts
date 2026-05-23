import { prisma } from "@/lib/db";

export type EventRecap = {
  eventId: string;
  title: string;
  phase: string;
  start: string | null;
  end: string | null;
  recapNote: string | null;
  participantSummary: {
    total: number;
    accepted: number;
    interested: number;
    declined: number;
    pending: number;
    waitlisted: number;
  };
  expenseSummary: { label: string; amountCents: number }[];
  expenseTotalCents: number;
  itineraryItemCount: number;
};

function countStatus(rows: { status: string; waitlistPosition: number | null }[]) {
  let accepted = 0;
  let interested = 0;
  let declined = 0;
  let pending = 0;
  let waitlisted = 0;
  for (const r of rows) {
    if (r.status === "accepted") accepted++;
    else if (r.status === "declined") declined++;
    else if (r.status === "pending") pending++;
    else if (r.status === "interested") {
      if (r.waitlistPosition != null) waitlisted++;
      else interested++;
    }
  }
  return { accepted, interested, declined, pending, waitlisted };
}

export async function aggregateEventRecap(eventId: string): Promise<EventRecap | null> {
  const event = await prisma.event.findUnique({
    where: { id: eventId },
    include: {
      participants: { select: { status: true, waitlistPosition: true } },
      expenses: { orderBy: { sortOrder: "asc" }, select: { label: true, amountCents: true } },
      planItems: { select: { id: true } },
    },
  });
  if (!event) return null;

  const p = countStatus(event.participants);
  const expenseTotalCents = event.expenses.reduce((s, e) => s + e.amountCents, 0);

  return {
    eventId: event.id,
    title: event.title,
    phase: event.phase,
    start: event.start?.toISOString() ?? null,
    end: event.end?.toISOString() ?? null,
    recapNote: event.recapNote,
    participantSummary: {
      total: event.participants.length,
      ...p,
    },
    expenseSummary: event.expenses.map((e) => ({
      label: e.label,
      amountCents: e.amountCents,
    })),
    expenseTotalCents,
    itineraryItemCount: event.planItems.length,
  };
}
