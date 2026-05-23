import { prisma } from "@/lib/db";

export async function duplicateEvent(eventId: string, actorId: string) {
  const source = await prisma.event.findUnique({
    where: { id: eventId },
    include: {
      participants: true,
    },
  });

  if (!source) return null;
  if (source.createdById !== actorId) return null;

  const duplicate = await prisma.event.create({
    data: {
      title: `${source.title} (copy)`,
      description: source.description,
      phase: "interest",
      visibility: source.visibility,
      maxParticipants: source.maxParticipants,
      costCurrency: source.costCurrency,
      costSplitEvenly: source.costSplitEvenly,
      guildId: source.guildId,
      createdById: actorId,
      participants: {
        create: [
          { userId: actorId, status: "interested" },
          ...source.participants
            .filter((p) => p.userId && p.userId !== actorId)
            .map((p) => ({
              userId: p.userId!,
              status: "pending" as const,
            })),
        ],
      },
    },
    include: { participants: true },
  });

  return duplicate;
}
