import { prisma } from "@/lib/db";

/** Default TTL when client omits `expiresAt` */
export const DEFAULT_SOFT_HOLD_TTL_MS = 48 * 60 * 60 * 1000;

export async function expireStaleSoftHoldsForGuild(guildId: string) {
  const now = new Date();
  await prisma.softHold.deleteMany({
    where: { guildId, expiresAt: { lt: now } },
  });
}

export async function createSoftHold(params: {
  guildId: string;
  createdById: string;
  title: string;
  start: Date;
  end: Date;
  expiresAt?: Date;
}) {
  if (params.end <= params.start) {
    return { ok: false as const, reason: "bad_range" as const };
  }
  const expiresAt =
    params.expiresAt ?? new Date(Date.now() + DEFAULT_SOFT_HOLD_TTL_MS);
  if (expiresAt <= new Date()) {
    return { ok: false as const, reason: "bad_expiry" as const };
  }
  const hold = await prisma.softHold.create({
    data: {
      guildId: params.guildId,
      createdById: params.createdById,
      title: params.title,
      start: params.start,
      end: params.end,
      expiresAt,
    },
    include: {
      createdBy: { select: { id: true, name: true, image: true } },
    },
  });
  return { ok: true as const, hold };
}

export async function listActiveSoftHolds(guildId: string) {
  await expireStaleSoftHoldsForGuild(guildId);
  return prisma.softHold.findMany({
    where: { guildId, convertedEventId: null },
    orderBy: { start: "asc" },
    include: {
      createdBy: { select: { id: true, name: true, image: true } },
    },
  });
}

export async function getSoftHoldForUser(holdId: string, userId: string) {
  const hold = await prisma.softHold.findFirst({
    where: { id: holdId, createdById: userId, convertedEventId: null },
  });
  if (!hold) return null;
  if (hold.expiresAt.getTime() < Date.now()) {
    await prisma.softHold.delete({ where: { id: holdId } });
    return null;
  }
  return hold;
}

export async function deleteSoftHoldIfOwner(holdId: string, userId: string) {
  const hold = await getSoftHoldForUser(holdId, userId);
  if (!hold) return { ok: false as const, reason: "not_found" as const };
  await prisma.softHold.delete({ where: { id: holdId } });
  return { ok: true as const };
}

export async function convertSoftHoldToEvent(params: {
  holdId: string;
  userId: string;
}) {
  const hold = await prisma.softHold.findFirst({
    where: {
      id: params.holdId,
      createdById: params.userId,
      convertedEventId: null,
    },
  });
  if (!hold) return { ok: false as const, reason: "not_found" as const };
  if (hold.expiresAt.getTime() < Date.now()) {
    await prisma.softHold.delete({ where: { id: hold.id } });
    return { ok: false as const, reason: "expired" as const };
  }

  const event = await prisma.$transaction(async (tx) => {
    const ev = await tx.event.create({
      data: {
        title: hold.title,
        description: `From soft hold · ${hold.start.toISOString().slice(0, 16)}`,
        phase: "interest",
        start: hold.start,
        end: hold.end,
        createdById: params.userId,
        guildId: hold.guildId,
        participants: {
          create: {
            userId: params.userId,
            status: "interested",
          },
        },
      },
    });
    await tx.softHold.update({
      where: { id: hold.id },
      data: { convertedEventId: ev.id },
    });
    return ev;
  });

  return { ok: true as const, eventId: event.id };
}
