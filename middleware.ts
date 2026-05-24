import NextAuth from "next-auth";
import { authConfig } from "@/auth.config";
import { NextResponse } from "next/server";

const { auth } = NextAuth(authConfig);

export default auth((req) => {
  const { pathname } = req.nextUrl;

  if (pathname.startsWith("/api/bot/")) {
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
