import { prisma } from "@/lib/db";

/** Promote the next bench player when a confirmed slot opens up. */
export async function promoteNextBackupParticipant(eventId: string) {
  const next = await prisma.eventParticipant.findFirst({
    where: {
      eventId,
      isBackup: true,
      status: "pending",
      userId: { not: null },
    },
    orderBy: { id: "asc" },
  });
  if (!next) return null;
  return prisma.eventParticipant.update({
    where: { id: next.id },
    data: { status: "accepted", isBackup: false },
  });
}
