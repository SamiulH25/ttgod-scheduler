/** Scheduled campaigns whose end time has passed are treated as completed. */
export function isCompletedScheduledEvent(event: {
  phase: string;
  end: Date | string | null;
}): boolean {
  if (event.phase !== "scheduled" || event.end == null) return false;
  const end =
    event.end instanceof Date ? event.end : new Date(event.end);
  return !Number.isNaN(end.getTime()) && end.getTime() < Date.now();
}

/** Pinned events stay on the board until the trip ends; only then may they be archived. */
export function canManuallyArchiveEvent(event: {
  phase: string;
  end: Date | string | null;
}): boolean {
  if (event.phase === "scheduled") {
    return isCompletedScheduledEvent(event);
  }
  return true;
}

export function eventListAccessWhere(userId: string) {
  return {
    OR: [
      { createdById: userId },
      { participants: { some: { userId } } },
      { phase: { in: ["interest", "scheduling"] } },
    ],
  };
}
