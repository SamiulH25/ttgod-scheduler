import { timingSafeEqual } from "crypto";
import type { NextResponse } from "next/server";
import { jsonError } from "@/lib/api-response";

function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  try {
    return timingSafeEqual(Buffer.from(a), Buffer.from(b));
  } catch {
    return false;
  }
}

export function verifyBotAuth(request: Request): NextResponse | null {
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

  return null;
}
