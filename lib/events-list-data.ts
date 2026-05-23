import { prisma } from "@/lib/db";
import { eventListAccessWhere } from "@/lib/event-archive";
import { maybeAutoArchiveCompletedEvents } from "@/lib/event-archive-scheduler";
import { eventListInclude } from "@/lib/event-access";

export type BulletinEventRecord = {
  id: string;
  title: string;
  description: string | null;
  phase: string;
  start: Date | null;
  end: Date | null;
  maxParticipants: number | null;
  costCurrency: string;
  costSplitEvenly: boolean;
  createdById: string;
  createdBy: { id: string; name: string | null; image: string | null };
  participants: {
    userId: string | null;
    status: string;
    guestEmail: string | null;
    displayName: string | null;
    user: { id: string; name: string | null; image: string | null } | null;
  }[];
  proposals: { id: string }[];
  expenses: { id: string; label: string; amountCents: number }[];
  seasonId: string | null;
  season: { id: string; name: string; color: string } | null;
};

function mapBulletinEvent(row: BulletinEventRecord) {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    phase: row.phase,
    start: row.start?.toISOString() ?? null,
    end: row.end?.toISOString() ?? null,
    maxParticipants: row.maxParticipants,
    costCurrency: row.costCurrency,
    costSplitEvenly: row.costSplitEvenly,
    createdById: row.createdById,
    createdBy: row.createdBy,
    participants: row.participants,
    proposals: row.proposals?.map((p) => ({ id: p.id })) ?? [],
    expenses: row.expenses ?? [],
    seasonId: row.seasonId ?? null,
    season: row.season
      ? { id: row.season.id, name: row.season.name, color: row.season.color }
      : null,
  };
}

export async function loadBulletinEvents(userId: string, archivedOnly: boolean) {
  await maybeAutoArchiveCompletedEvents();

  const events = await prisma.event.findMany({
    where: {
      ...eventListAccessWhere(userId),
      archivedAt: archivedOnly ? { not: null } : null,
    },
    include: eventListInclude,
    orderBy: archivedOnly
      ? [{ archivedAt: "desc" }]
      : [{ phase: "asc" }, { start: "asc" }, { updatedAt: "desc" }],
  });

  return events.map(mapBulletinEvent);
}

export async function loadBulletinPageData(userId: string) {
  const [events, archivedEvents, users] = await Promise.all([
    loadBulletinEvents(userId, false),
    loadBulletinEvents(userId, true),
    prisma.user.findMany({
      where: { discordId: { not: null } },
      select: { id: true, name: true, image: true },
      orderBy: { name: "asc" },
    }),
  ]);

  return { events, archivedEvents, users };
}

export async function loadScheduledEventRanges(userId: string) {
  const events = await prisma.event.findMany({
    where: {
      OR: [
        { createdById: userId },
        { participants: { some: { userId } } },
      ],
      phase: "scheduled",
      start: { not: null },
      end: { not: null },
    },
    select: {
      id: true,
      title: true,
      phase: true,
      start: true,
      end: true,
      createdById: true,
      participants: { select: { userId: true, status: true } },
    },
  });

  return events.map((e) => ({
    id: e.id,
    title: e.title,
    phase: e.phase,
    start: e.start!.toISOString(),
    end: e.end!.toISOString(),
    createdById: e.createdById,
    participants: e.participants,
  }));
}
