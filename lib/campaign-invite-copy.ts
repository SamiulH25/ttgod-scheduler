export function invitePanelDescription(phase: string, isHost: boolean): string {
  if (phase === "scheduled") {
    return isHost
      ? "Invite squad members, then share one link so they can accept the pinned time."
      : "Who’s on the roster for this session.";
  }
  if (phase === "scheduling") {
    return isHost
      ? "Add anyone who should vote on times, then share the campaign link."
      : "Squad on this campaign.";
  }
  return isHost
    ? "Add squad members and share one link — they sign in and say if they’re in."
    : "Squad on this campaign.";
}

export function inviteLinkHint(phase: string): string {
  if (phase === "scheduled") {
    return "Opens a read-only card; after Discord sign-in they can accept or decline.";
  }
  return "Opens the campaign — squad taps “Yes, I’m in” after signing in.";
}
