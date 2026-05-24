import { describe, expect, it } from "vitest";
import { summarizeCampaignInterest } from "@/lib/campaign-interest";

describe("summarizeCampaignInterest", () => {
  it("counts interested, awaiting, and scheduling roster", () => {
    const stats = summarizeCampaignInterest([
      { userId: "a", status: "interested" },
      { userId: "b", status: "not_interested" },
      { userId: "c", status: "pending" },
      { userId: null, status: "interested" },
    ]);
    expect(stats.interested).toHaveLength(1);
    expect(stats.notInterested).toHaveLength(1);
    expect(stats.awaiting).toHaveLength(1);
    expect(stats.schedulingRosterCount).toBe(2);
  });
});
