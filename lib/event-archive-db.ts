import { prisma } from "@/lib/db";

/** Persist archive only after a pinned trip's end time has passed (idempotent). */
export async function autoArchiveCompletedEvents(): Promise<void> {
  const now = new Date();
  await prisma.event.updateMany({
    where: {
      archivedAt: null,
      phase: "scheduled",
      end: { not: null, lt: now },
    },
    data: { archivedAt: now },
  });
}
