import { describe, expect, it } from "vitest";
import {
  bordaCount,
  pickWinningProposal,
  pickWinningProposalRanked,
} from "./campaign-voting";

describe("pickWinningProposal", () => {
  it("picks highest vote count", () => {
    const winner = pickWinningProposal([
      { id: "a", start: "2026-05-21T10:00:00Z", end: "2026-05-21T12:00:00Z", voteCount: 2 },
      { id: "b", start: "2026-05-21T14:00:00Z", end: "2026-05-21T16:00:00Z", voteCount: 5 },
    ]);
    expect(winner?.id).toBe("b");
  });

  it("tie-breaks to earliest start", () => {
    const winner = pickWinningProposal([
      { id: "late", start: "2026-05-21T18:00:00Z", end: "2026-05-21T20:00:00Z", voteCount: 3 },
      { id: "early", start: "2026-05-21T10:00:00Z", end: "2026-05-21T12:00:00Z", voteCount: 3 },
    ]);
    expect(winner?.id).toBe("early");
  });
});

describe("bordaCount", () => {
  const poll = ["p1", "p2", "p3"];
  const votes = [
    { userId: "u1", proposalId: "p1", rank: 1 },
    { userId: "u1", proposalId: "p2", rank: 2 },
    { userId: "u1", proposalId: "p3", rank: 3 },
    { userId: "u2", proposalId: "p2", rank: 1 },
    { userId: "u2", proposalId: "p1", rank: 2 },
    { userId: "u2", proposalId: "p3", rank: 3 },
  ];

  it("scores first-choice highest", () => {
    expect(bordaCount("p1", votes, poll)).toBe(2 + 1);
    expect(bordaCount("p2", votes, poll)).toBe(1 + 2);
  });
});

describe("pickWinningProposalRanked", () => {
  it("picks highest Borda score", () => {
    const proposals = [
      { id: "a", start: "2026-05-21T10:00:00Z", end: "2026-05-21T11:00:00Z", votes: [] },
      { id: "b", start: "2026-05-21T12:00:00Z", end: "2026-05-21T13:00:00Z", votes: [] },
    ];
    const votes = [
      { userId: "u1", proposalId: "b", rank: 1 },
      { userId: "u1", proposalId: "a", rank: 2 },
      { userId: "u2", proposalId: "b", rank: 1 },
      { userId: "u2", proposalId: "a", rank: 2 },
    ];
    const w = pickWinningProposalRanked(proposals, votes);
    expect(w?.id).toBe("b");
  });
});
