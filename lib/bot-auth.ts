import { timingSafeEqual } from "crypto";
import { NextResponse } from "next/server";

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
    return NextResponse.json(
      { error: "Bot API not configured", code: "BOT_API_DISABLED" },
      { status: 503 },
    );
  }

  const header = request.headers.get("authorization");
  if (!header?.startsWith("Bearer ")) {
    return NextResponse.json(
      { error: "Missing or invalid authorization", code: "UNAUTHORIZED" },
      { status: 401 },
    );
  }

  const token = header.slice(7);
  if (!safeEqual(token, secret)) {
    return NextResponse.json(
      { error: "Invalid API token", code: "UNAUTHORIZED" },
      { status: 401 },
    );
  }

  return null;
}
