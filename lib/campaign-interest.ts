export type InterestParticipant = {
  userId: string | null;
  status: string;
  user?: { id: string; name: string | null; image: string | null } | null;
};

export type CampaignInterestStats = {
  interested: InterestParticipant[];
  notInterested: InterestParticipant[];
  awaiting: InterestParticipant[];
  /** Members included when finding squad times (excludes not interested / declined). */
  schedulingRosterCount: number;
};

export function summarizeCampaignInterest(
  participants: InterestParticipant[],
): CampaignInterestStats {
  const members = participants.filter((p) => p.userId);
  const interested = members.filter((p) => p.status === "interested");
  const notInterested = members.filter((p) => p.status === "not_interested");
  const awaiting = members.filter(
    (p) =>
      p.status !== "interested" &&
      p.status !== "not_interested" &&
      p.status !== "declined",
  );
  const schedulingRosterCount = members.filter(
    (p) => p.status !== "not_interested" && p.status !== "declined",
  ).length;

  return {
    interested,
    notInterested,
    awaiting,
    schedulingRosterCount,
  };
}
