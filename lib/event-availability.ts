import { prisma } from "@/lib/db";

export type NotifyTarget = {
  userId: string;
  discordId: string | null;
  name: string | null;
  image: string | null;
};

/** Users with availability overlapping the given window. */
export async function findUsersFreeDuring(
  start: Date,
  end: Date,
): Promise<NotifyTarget[]> {
  const blocks = await prisma.availabilityBlock.findMany({
    where: {
      start: { lt: end },
      end: { gt: start },
    },
    include: {
      user: {
        select: { id: true, discordId: true, name: true, image: true },
      },
    },
  });

  const byUser = new Map<string, NotifyTarget>();
  for (const block of blocks) {
    if (!byUser.has(block.userId)) {
      byUser.set(block.userId, {
        userId: block.user.id,
        discordId: block.user.discordId,
        name: block.user.name,
        image: block.user.image,
      });
    }
  }

  return [...byUser.values()].sort((a, b) =>
    (a.name ?? "").localeCompare(b.name ?? ""),
  );
}

/** Discord IDs only — for bot ping documentation consumers. */
export function notifyTargetsForBot(targets: NotifyTarget[]): NotifyTarget[] {
  return targets.filter((t) => t.discordId != null);
}
