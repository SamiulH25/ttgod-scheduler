export type ProposalWithVotes = {
  id: string;
  start: Date | string;
  end: Date | string;
  voteCount: number;
};

export type ProposalVoteRank = {
  userId: string;
  proposalId: string;
  rank: number;
};

export function pickWinningProposal(
  proposals: ProposalWithVotes[],
): ProposalWithVotes | null {
  if (proposals.length === 0) return null;

  let best = proposals[0]!;
  for (const p of proposals.slice(1)) {
    if (p.voteCount > best.voteCount) {
      best = p;
    } else if (
      p.voteCount === best.voteCount &&
      new Date(p.start).getTime() < new Date(best.start).getTime()
    ) {
      best = p;
    }
  }
  return best;
}

/**
 * Classic Borda: with `n` proposals in the poll, rank 1 (best) receives `n-1` points,
 * rank 2 receives `n-2`, … last receives `0`. Unranked proposals for a voter score `0`.
 */
export function bordaCount(
  proposalId: string,
  votes: ProposalVoteRank[],
  proposalIdsInPoll: string[],
): number {
  const n = proposalIdsInPoll.length;
  if (n <= 1) return 0;

  const indexByProposal = new Map(proposalIdsInPoll.map((id, i) => [id, i]));
  const byUser = new Map<string, ProposalVoteRank[]>();
  for (const v of votes) {
    if (!indexByProposal.has(v.proposalId)) continue;
    const list = byUser.get(v.userId) ?? [];
    list.push(v);
    byUser.set(v.userId, list);
  }

  let total = 0;
  for (const [, list] of byUser) {
    const row = list.find((v) => v.proposalId === proposalId);
    if (!row) continue;
    const r = row.rank;
    if (r < 1 || r > n) continue;
    total += n - r;
  }
  return total;
}

export type ProposalWithRankedVotes = {
  id: string;
  start: Date | string;
  end: Date | string;
  votes: ProposalVoteRank[];
};

export function pickWinningProposalRanked(
  proposals: ProposalWithRankedVotes[],
  votes: ProposalVoteRank[],
): ProposalWithRankedVotes | null {
  if (proposals.length === 0) return null;
  const ids = proposals.map((p) => p.id);

  let best = proposals[0]!;
  let bestScore = bordaCount(best.id, votes, ids);

  for (const p of proposals.slice(1)) {
    const score = bordaCount(p.id, votes, ids);
    if (score > bestScore) {
      best = p;
      bestScore = score;
    } else if (score === bestScore) {
      if (new Date(p.start).getTime() < new Date(best.start).getTime()) {
        best = p;
        bestScore = score;
      }
    }
  }
  return best;
}
