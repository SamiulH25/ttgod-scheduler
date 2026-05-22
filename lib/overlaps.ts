import { addDays, startOfDay } from "date-fns";
import type { CalendarBlock } from "@/lib/calendar";
import { getBlocksForDay } from "@/lib/calendar";

export type SquadOverlap = {
  start: string;
  end: string;
  count: number;
  userIds: string[];
  users: { id: string; name: string | null; image: string | null }[];
};

function daysInRange(from: Date, to: Date): Date[] {
  const days: Date[] = [];
  let d = startOfDay(from);
  const end = startOfDay(to);
  while (d < end) {
    days.push(new Date(d));
    d = addDays(d, 1);
  }
  return days;
}

/** Find intervals where 2+ distinct users are simultaneously free */
export function findSquadOverlaps(
  blocks: CalendarBlock[],
  from: Date,
  to: Date,
): SquadOverlap[] {
  const overlaps: SquadOverlap[] = [];

  for (const day of daysInRange(from, to)) {
    const segments = getBlocksForDay(day, blocks);
    if (segments.length < 2) continue;

    const points: Array<{ t: number; delta: number }> = [];
    for (const seg of segments) {
      points.push({ t: seg.startMin, delta: 1 });
      points.push({ t: seg.endMin, delta: -1 });
    }
    points.sort((a, b) => a.t - b.t || a.delta - b.delta);

    let count = 0;
    let overlapStart: number | null = null;

    for (const { t, delta } of points) {
      const prev = count;
      count += delta;

      if (prev < 2 && count >= 2) overlapStart = t;
      if (prev >= 2 && count < 2 && overlapStart !== null) {
        const userIds = [
          ...new Set(
            segments
              .filter((s) => s.startMin < t && s.endMin > overlapStart!)
              .map((s) => s.block.userId),
          ),
        ];

        if (userIds.length >= 2) {
          const startDate = new Date(day);
          startDate.setHours(0, 0, 0, 0);
          startDate.setMinutes(overlapStart);
          const endDate = new Date(day);
          endDate.setHours(0, 0, 0, 0);
          endDate.setMinutes(t);

          overlaps.push({
            start: startDate.toISOString(),
            end: endDate.toISOString(),
            count: userIds.length,
            userIds,
            users: userIds.map((id) => {
              const block = segments.find((s) => s.block.userId === id)!.block;
              return {
                id,
                name: block.user.name,
                image: block.user.image,
              };
            }),
          });
        }
        overlapStart = null;
      }
    }
  }

  return overlaps
    .filter((o) => new Date(o.start) < to && new Date(o.end) > from)
    .sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime());
}
