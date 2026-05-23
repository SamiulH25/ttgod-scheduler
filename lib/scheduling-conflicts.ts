import { prisma } from "@/lib/db";

export type SchedulingAvailabilitySlice = {
  userId: string;
  start: Date;
  end: Date;
  /** free | tentative | busy */
  status: string;
};

export type SchedulingConflictUser = {
  userId: string;
  name: string | null;
  image: string | null;
  status: "busy" | "tentative";
};

function intervalsOverlap(a0: Date, a1: Date, b0: Date, b1: Date) {
  return a0 < b1 && b0 < a1;
}

/**
 * Users whose availability is `busy` or `tentative` overlapping the proposal window.
 * `free` blocks are ignored.
 */
export function findBusyTentativeOverlappingProposal(
  windowStart: Date,
  windowEnd: Date,
  blocks: SchedulingAvailabilitySlice[],
): { userId: string; status: string }[] {
  const hits = new Map<string, string>();
  for (const b of blocks) {
    const st = (b.status ?? "free").toLowerCase();
    if (st !== "busy" && st !== "tentative") continue;
    if (!intervalsOverlap(windowStart, windowEnd, b.start, b.end)) continue;
    hits.set(b.userId, st);
  }
  return [...hits.entries()].map(([userId, status]) => ({ userId, status }));
}

/** Load overlapping blocks and attach user display fields. */
export async function findSchedulingConflicts(
  windowStart: Date,
  windowEnd: Date,
): Promise<SchedulingConflictUser[]> {
  const blocks = await prisma.availabilityBlock.findMany({
    where: { start: { lt: windowEnd }, end: { gt: windowStart } },
    select: {
      userId: true,
      start: true,
      end: true,
      status: true,
      user: { select: { name: true, image: true } },
    },
  });
  const slices: SchedulingAvailabilitySlice[] = blocks.map((b) => ({
    userId: b.userId,
    start: b.start,
    end: b.end,
    status: b.status ?? "free",
  }));
  const hits = findBusyTentativeOverlappingProposal(windowStart, windowEnd, slices);
  const byUser = new Map(blocks.map((b) => [b.userId, b]));
  return hits.map((h) => {
    const row = byUser.get(h.userId);
    const st = h.status === "tentative" ? "tentative" : "busy";
    return {
      userId: h.userId,
      name: row?.user.name ?? null,
      image: row?.user.image ?? null,
      status: st,
    };
  });
}
