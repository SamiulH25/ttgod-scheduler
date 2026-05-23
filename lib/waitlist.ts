import { prisma } from "@/lib/db";

export async function maxWaitlistPosition(eventId: string): Promise<number> {
  const agg = await prisma.eventParticipant.aggregate({
    where: { eventId, waitlistPosition: { not: null } },
    _max: { waitlistPosition: true },
  });
  return agg._max.waitlistPosition ?? 0;
}

export async function assignWaitlistPosition(
  eventId: string,
  participationId: string,
): Promise<number> {
  const next = (await maxWaitlistPosition(eventId)) + 1;
  await prisma.eventParticipant.update({
    where: { id: participationId },
    data: { waitlistPosition: next },
  });
  return next;
}

export async function clearWaitlistPosition(participationId: string): Promise<void> {
  await prisma.eventParticipant.update({
    where: { id: participationId },
    data: { waitlistPosition: null },
  });
}

/**
 * After someone leaves or drops interest, re-pack waitlist positions (1..n) for remaining
 * `interested` rows that still carry a position.
 */
export async function normalizeWaitlistPositions(eventId: string): Promise<void> {
  const waiting = await prisma.eventParticipant.findMany({
    where: { eventId, status: "interested", waitlistPosition: { not: null } },
    orderBy: { waitlistPosition: "asc" },
  });
  let i = 1;
  for (const row of waiting) {
    if (row.waitlistPosition !== i) {
      await prisma.eventParticipant.update({
        where: { id: row.id },
        data: { waitlistPosition: i },
      });
    }
    i += 1;
  }
}

/**
 * When capacity opens, promote the first waitlisted interested participant (lowest position).
 */
export async function promoteNextFromWaitlist(eventId: string): Promise<void> {
  const first = await prisma.eventParticipant.findFirst({
    where: { eventId, status: "interested", waitlistPosition: { not: null } },
    orderBy: { waitlistPosition: "asc" },
  });
  if (!first) return;
  await prisma.eventParticipant.update({
    where: { id: first.id },
    data: { waitlistPosition: null },
  });
  await normalizeWaitlistPositions(eventId);
}
