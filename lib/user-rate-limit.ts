import { NextResponse } from "next/server";
import { jsonError } from "@/lib/api-response";
import { checkRateLimit } from "@/lib/rate-limit";

export async function checkUserWriteRateLimit(
  userId: string,
  action: string,
  limit: number,
): Promise<NextResponse | null> {
  const result = await checkRateLimit(`user:${userId}:${action}`, limit);
  if (!result.ok) {
    return jsonError("Too many requests", "RATE_LIMITED", 429);
  }
  return null;
}
