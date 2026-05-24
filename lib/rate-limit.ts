import { prisma } from "@/lib/db";

const WINDOW_MS = 60_000;

export type RateLimitResult =
  | { ok: true }
  | { ok: false; retryAfterSec: number };

/**
 * Fixed-window rate limit stored in Postgres (works across app instances).
 */
export async function checkRateLimit(
  bucketKey: string,
  limit: number,
  windowMs: number = WINDOW_MS,
): Promise<RateLimitResult> {
  const now = new Date();
  const windowStart = new Date(
    Math.floor(now.getTime() / windowMs) * windowMs,
  );

  const row = await prisma.rateLimitBucket.upsert({
    where: {
      bucketKey_windowStart: { bucketKey, windowStart },
    },
    create: { bucketKey, windowStart, count: 1 },
    update: { count: { increment: 1 } },
  });

  if (row.count > limit) {
    const retryAfterSec = Math.ceil(
      (windowStart.getTime() + windowMs - now.getTime()) / 1000,
    );
    return { ok: false, retryAfterSec: Math.max(1, retryAfterSec) };
  }

  return { ok: true };
}

/** Prune buckets older than 2 hours (call occasionally from middleware). */
export async function pruneRateLimitBuckets(): Promise<void> {
  const cutoff = new Date(Date.now() - 2 * 60 * 60 * 1000);
  await prisma.rateLimitBucket.deleteMany({
    where: { windowStart: { lt: cutoff } },
  });
}
