import { prisma } from "@/lib/db";
import { jsonError } from "@/lib/api-response";

export async function getEventForUser(eventId: string, userId: string) {
  return prisma.event.findFirst({
    where: {
      id: eventId,
      OR: [
        { createdById: userId },
        { participants: { some: { userId } } },
      ],
    },
    include: {
      createdBy: {
        select: { id: true, name: true, image: true, discordId: true },
      },
      participants: {
        include: {
          user: {
            select: { id: true, name: true, image: true, discordId: true },
          },
        },
      },
      planItems: { orderBy: { sortOrder: "asc" } },
    },
  });
}

export async function requireEventHost(eventId: string, userId: string) {
  const event = await getEventForUser(eventId, userId);
  if (!event || event.createdById !== userId) {
    return { event: null, error: jsonError("Event not found or not host", "FORBIDDEN", 403) };
  }
  return { event, error: null };
}

export const eventInclude = {
  createdBy: { select: { id: true, name: true, image: true, discordId: true } },
  participants: {
    include: {
      user: { select: { id: true, name: true, image: true, discordId: true } },
    },
  },
  planItems: { orderBy: { sortOrder: "asc" as const } },
};
