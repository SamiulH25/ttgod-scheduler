export type ParticipantLike = { status: string };

export function countTowardCap(
  phase: string,
  participants: ParticipantLike[],
): number {
  if (phase === "interest" || phase === "scheduling") {
    return participants.filter((p) => p.status === "interested").length;
  }
  return participants.filter((p) => p.status === "accepted").length;
}

export function isAtCapacity(
  phase: string,
  participants: ParticipantLike[],
  maxParticipants: number | null | undefined,
): boolean {
  if (maxParticipants == null || maxParticipants <= 0) return false;
  return countTowardCap(phase, participants) >= maxParticipants;
}

export function canAddParticipant(
  phase: string,
  participants: ParticipantLike[],
  maxParticipants: number | null | undefined,
  additional = 1,
): boolean {
  if (maxParticipants == null || maxParticipants <= 0) return true;
  return (
    countTowardCap(phase, participants) + additional <= maxParticipants
  );
}
