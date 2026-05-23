import { buildDayLayout, type CalendarBlock } from "@/lib/calendar";

export type SquadMemberRow = {
  userId: string;
  user: CalendarBlock["user"];
  blockCount: number;
  lfgNote?: string | null;
};

export type AvailabilityViewFilter = "all" | "mine" | "overlaps";

export function buildSquadRoster(
  blocks: CalendarBlock[],
  currentUserId: string,
): SquadMemberRow[] {
  const counts = new Map<string, SquadMemberRow>();

  for (const block of blocks) {
    const existing = counts.get(block.userId);
    if (existing) {
      existing.blockCount += 1;
      continue;
    }
    counts.set(block.userId, {
      userId: block.userId,
      user: block.user,
      blockCount: 1,
    });
  }

  return [...counts.values()]
    .map((row) => {
      const userBlocks = blocks.filter((b) => b.userId === row.userId);
      let lfg: string | null | undefined;
      for (const b of userBlocks) {
        const n = (b as { lfgNote?: string | null }).lfgNote;
        if (n && n.trim()) lfg = n.trim();
      }
      return { ...row, lfgNote: lfg ?? null };
    })
    .sort((a, b) => {
    if (a.userId === currentUserId) return -1;
    if (b.userId === currentUserId) return 1;
    if (b.blockCount !== a.blockCount) return b.blockCount - a.blockCount;
    return (a.user.name ?? "").localeCompare(b.user.name ?? "");
  });
}

export function countWeekOverlapBands(
  blocks: CalendarBlock[],
  weekDays: Date[],
): number {
  let total = 0;
  for (const day of weekDays) {
    total += buildDayLayout(day, blocks).overlapBands.length;
  }
  return total;
}

export function countMyBlocks(blocks: CalendarBlock[], userId: string): number {
  return blocks.filter((b) => b.userId === userId).length;
}
