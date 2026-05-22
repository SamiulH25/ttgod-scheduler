import NextAuth from "next-auth";
import { authConfig } from "@/auth.config";
import { NextResponse } from "next/server";

const { auth } = NextAuth(authConfig);

const botRateLimit = new Map<string, { count: number; resetAt: number }>();
const BOT_RATE_LIMIT = 120;
const BOT_RATE_WINDOW_MS = 60_000;

function checkBotRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = botRateLimit.get(ip);
  if (!entry || now > entry.resetAt) {
    botRateLimit.set(ip, { count: 1, resetAt: now + BOT_RATE_WINDOW_MS });
    return true;
  }
  if (entry.count >= BOT_RATE_LIMIT) return false;
  entry.count += 1;
  return true;
}

export default auth((req) => {
  const { pathname } = req.nextUrl;

  if (pathname.startsWith("/api/bot/")) {
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
    if (!checkBotRateLimit(ip)) {
      return NextResponse.json(
        { error: "Rate limit exceeded", code: "RATE_LIMITED" },
        { status: 429 },
      );
    }
    return NextResponse.next();
  }

  const isAppRoute =
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/availability") ||
    pathname.startsWith("/events") ||
    pathname.startsWith("/settings") ||
    pathname.startsWith("/squad");

  if (isAppRoute && !req.auth) {
    const signInUrl = new URL("/", req.url);
    signInUrl.searchParams.set("callbackUrl", pathname);
    signInUrl.searchParams.set("signin", "required");
    return NextResponse.redirect(signInUrl);
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/availability/:path*",
    "/events/:path*",
    "/settings/:path*",
    "/squad/:path*",
    "/api/bot/:path*",
  ],
};
