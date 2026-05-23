import { describe, expect, it, vi, beforeEach } from "vitest";
import { findUsersFreeDuring, notifyTargetsForBot } from "./event-availability";

vi.mock("@/lib/db", () => ({
  prisma: {
    availabilityBlock: {
      findMany: vi.fn(),
    },
  },
}));

import { prisma } from "@/lib/db";

const mockFindMany = vi.mocked(prisma.availabilityBlock.findMany);

describe("findUsersFreeDuring", () => {
  beforeEach(() => {
    mockFindMany.mockReset();
  });

  it("includes users with overlapping availability", async () => {
    mockFindMany.mockResolvedValue([
      {
        userId: "u1",
        user: { id: "u1", discordId: "d1", name: "Alice", image: null },
      },
      {
        userId: "u2",
        user: { id: "u2", discordId: "d2", name: "Bob", image: null },
      },
    ] as never);

    const start = new Date("2026-05-21T18:00:00Z");
    const end = new Date("2026-05-21T20:00:00Z");
    const result = await findUsersFreeDuring(start, end);

    expect(result).toHaveLength(2);
    expect(mockFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          start: { lt: end },
          end: { gt: start },
          status: "free",
          user: {
            OR: [{ awayUntil: null }, { awayUntil: { lte: expect.any(Date) } }],
          },
        }),
      }),
    );
  });

  it("optionally includes tentative blocks", async () => {
    mockFindMany.mockResolvedValue([] as never);
    await findUsersFreeDuring(new Date(), new Date(), { includeTentative: true });
    expect(mockFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          status: { in: ["free", "tentative"] },
          user: {
            OR: [{ awayUntil: null }, { awayUntil: { lte: expect.any(Date) } }],
          },
        }),
      }),
    );
  });

  it("deduplicates multiple blocks per user", async () => {
    mockFindMany.mockResolvedValue([
      {
        userId: "u1",
        user: { id: "u1", discordId: "d1", name: "Alice", image: null },
      },
      {
        userId: "u1",
        user: { id: "u1", discordId: "d1", name: "Alice", image: null },
      },
    ] as never);

    const result = await findUsersFreeDuring(
      new Date("2026-05-21T18:00:00Z"),
      new Date("2026-05-21T20:00:00Z"),
    );
    expect(result).toHaveLength(1);
  });

  it("notifyTargetsForBot filters users without discordId", () => {
    const targets = notifyTargetsForBot([
      { userId: "1", discordId: "d1", name: "A", image: null },
      { userId: "2", discordId: null, name: "Dev", image: null },
    ]);
    expect(targets).toHaveLength(1);
    expect(targets[0]!.discordId).toBe("d1");
  });
});
