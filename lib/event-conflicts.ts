export type EventTimeRange = {
  id: string;
  title: string;
  phase?: string;
  start: string | Date | null;
  end: string | Date | null;
  createdById: string;
  participants: { userId: string | null; status: string }[];
};

function hasScheduledWindow(event: EventTimeRange): boolean {
  if (event.phase && event.phase !== "scheduled") return false;
  return event.start != null && event.end != null;
}

export function toEventDate(value: string | Date): Date {
  return value instanceof Date ? value : new Date(value);
}

/** True when [aStart, aEnd) overlaps [bStart, bEnd). */
export function intervalsOverlap(
  aStart: Date,
  aEnd: Date,
  bStart: Date,
  bEnd: Date,
): boolean {
  return aStart < bEnd && bStart < aEnd;
}

export function userSharesEvent(
  event: EventTimeRange,
  userId: string,
): boolean {
  if (event.createdById === userId) return true;
  return event.participants.some(
    (p) => p.userId === userId && p.status !== "declined",
  );
}

export function findConflictingEvents(
  events: EventTimeRange[],
  rangeStart: Date,
  rangeEnd: Date,
  currentUserId: string,
  excludeEventId?: string,
): EventTimeRange[] {
  if (rangeEnd <= rangeStart) return [];

  return events.filter((ev) => {
    if (excludeEventId && ev.id === excludeEventId) return false;
    if (!hasScheduledWindow(ev)) return false;
    if (!userSharesEvent(ev, currentUserId)) return false;
    if (ev.start == null || ev.end == null) return false;
    return intervalsOverlap(
      rangeStart,
      rangeEnd,
      toEventDate(ev.start),
      toEventDate(ev.end),
    );
  });
}

export type EventConflictPair = {
  a: EventTimeRange;
  b: EventTimeRange;
};

/** All overlapping pairs the user is involved in (for bulletin alerts). */
export function findEventConflictPairs(
  events: EventTimeRange[],
  currentUserId: string,
): EventConflictPair[] {
  const mine = events.filter(
    (ev) => userSharesEvent(ev, currentUserId) && hasScheduledWindow(ev),
  );
  const pairs: EventConflictPair[] = [];

  for (let i = 0; i < mine.length; i++) {
    for (let j = i + 1; j < mine.length; j++) {
      const a = mine[i]!;
      const b = mine[j]!;
      if (
        a.start != null &&
        a.end != null &&
        b.start != null &&
        b.end != null &&
        intervalsOverlap(
          toEventDate(a.start),
          toEventDate(a.end),
          toEventDate(b.start),
          toEventDate(b.end),
        )
      ) {
        pairs.push({ a, b });
      }
    }
  }

  return pairs;
}

export function formatConflictMessage(
  conflicts: EventTimeRange[],
): string {
  if (conflicts.length === 0) return "";
  if (conflicts.length === 1) {
    return `Overlaps with “${conflicts[0]!.title}”.`;
  }
  const names = conflicts.map((c) => `“${c.title}”`).join(", ");
  return `Overlaps with ${names}.`;
}
