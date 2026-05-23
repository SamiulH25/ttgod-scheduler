import { prisma } from "@/lib/db";

export type ActivityType =
  | "availability.created"
  | "availability.updated"
  | "availability.deleted"
  | "event.created"
  | "event.duplicated"
  | "event.phase_changed"
  | "event.finalized"
  | "event.archived"
  | "participation.updated"
  | "soft_hold.created"
  | "soft_hold.converted"
  | "season.created"
  | "wall_note.updated"
  | "attendance.updated"
  | "option.voted";

export async function logActivity(params: {
  type: ActivityType;
  actorId?: string | null;
  entityType: string;
  entityId: string;
  metadata?: Record<string, unknown>;
}) {
  try {
    await prisma.activity.create({
      data: {
        type: params.type,
        actorId: params.actorId ?? null,
        entityType: params.entityType,
        entityId: params.entityId,
        metadata: params.metadata ? JSON.stringify(params.metadata) : null,
      },
    });
  } catch {
    // Non-blocking
  }
}

export async function listActivities(options: {
  limit?: number;
  cursor?: string;
  entityType?: string;
}) {
  const limit = options.limit ?? 30;
  return prisma.activity.findMany({
    where: options.entityType ? { entityType: options.entityType } : undefined,
    orderBy: { createdAt: "desc" },
    take: limit,
    ...(options.cursor
      ? { cursor: { id: options.cursor }, skip: 1 }
      : {}),
    include: {
      actor: { select: { id: true, name: true, image: true } },
    },
  });
}
