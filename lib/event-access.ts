import { prisma } from "@/lib/db";
import { jsonError } from "@/lib/api-response";

/** Open interest/scheduling campaigns are visible to the whole squad. */
export async function getEventForUser(eventId: string, userId: string) {
  return prisma.event.findFirst({
    where: {
      id: eventId,
      OR: [
        { createdById: userId },
        { participants: { some: { userId } } },
        { phase: { in: ["interest", "scheduling"] } },
      ],
    },
    include: eventInclude,
  });
}

export async function requireEventHost(eventId: string, userId: string) {
  const event = await getEventForUser(eventId, userId);
  if (!event || event.createdById !== userId) {
    return {
      event: null,
      error: jsonError("Event not found or not host", "FORBIDDEN", 403),
    };
  }
  return { event, error: null };
}

/** Bulletin / list views — omit plan items, images, full vote graph */
export const eventListInclude = {
  createdBy: { select: { id: true, name: true, image: true, discordId: true } },
  participants: {
    include: {
      user: { select: { id: true, name: true, image: true, discordId: true } },
    },
  },
  proposals: {
    orderBy: { start: "asc" as const },
    select: { id: true },
  },
  expenses: {
    orderBy: { sortOrder: "asc" as const },
    select: {
      id: true,
      label: true,
      amountCents: true,
      paidById: true,
      splits: true,
    },
  },
  season: { select: { id: true, name: true, color: true } },
};

export const eventInclude = {
  createdBy: { select: { id: true, name: true, image: true, discordId: true } },
  participants: {
    include: {
      user: { select: { id: true, name: true, image: true, discordId: true } },
    },
  },
  planItems: { orderBy: { sortOrder: "asc" as const } },
  proposals: {
    orderBy: { start: "asc" as const },
    include: {
      createdBy: { select: { id: true, name: true, image: true } },
      votes: { select: { userId: true, rank: true } },
    },
  },
  proposalVotes: {
    select: { userId: true, proposalId: true, rank: true },
  },
  options: {
    orderBy: { sortOrder: "asc" as const },
    include: {
      votes: { select: { userId: true, optionId: true } },
    },
  },
  roles: { orderBy: { sortOrder: "asc" as const } },
  season: { select: { id: true, name: true, color: true } },
  images: {
    orderBy: { createdAt: "desc" as const },
    include: {
      uploadedBy: { select: { id: true, name: true, image: true } },
    },
  },
  expenses: { orderBy: { sortOrder: "asc" as const } },
  resources: {
    orderBy: { sortOrder: "asc" as const },
    include: {
      createdBy: { select: { id: true, name: true, image: true } },
    },
  },
};
