import { timingSafeEqual } from "crypto";
import { NextResponse } from "next/server";
import { jsonError } from "@/lib/api-response";
import { checkRateLimit } from "@/lib/rate-limit";

const BOT_RATE_LIMIT = 120;

function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  try {
    return timingSafeEqual(Buffer.from(a), Buffer.from(b));
  } catch {
    return false;
  }
}

export async function verifyBotAuth(
  request: Request,
): Promise<NextResponse | null> {
  const secret = process.env.BOT_API_SECRET;
  if (!secret) {
    return jsonError("Bot API not configured", "BOT_API_DISABLED", 503);
  }

  const header = request.headers.get("authorization");
  if (!header?.startsWith("Bearer ")) {
    return jsonError("Missing or invalid authorization", "UNAUTHORIZED", 401);
  }

  const token = header.slice(7);
  if (!safeEqual(token, secret)) {
    return jsonError("Invalid API token", "UNAUTHORIZED", 401);
  }

  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  const limited = await checkRateLimit(`bot:${ip}`, BOT_RATE_LIMIT);
  if (!limited.ok) {
    return NextResponse.json(
      { error: "Rate limit exceeded", code: "RATE_LIMITED" },
      {
        status: 429,
        headers: { "Retry-After": String(limited.retryAfterSec) },
      },
    );
  }

  return null;
}
