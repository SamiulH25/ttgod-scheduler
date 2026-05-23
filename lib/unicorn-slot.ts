import type { SquadOverlap } from "@/lib/overlaps";

/**
 * A “unicorn” slot is when everyone who posted availability in the window
 * overlaps at the same time (full-squad alignment).
 */
export function isUnicornOverlap(
  overlap: Pick<SquadOverlap, "count" | "userIds">,
  distinctAvailUsersInRange: number,
): boolean {
  if (distinctAvailUsersInRange < 2) return false;
  return overlap.count === distinctAvailUsersInRange;
}
