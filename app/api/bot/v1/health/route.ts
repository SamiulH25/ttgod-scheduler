import { NextResponse } from "next/server";
import { verifyBotAuth } from "@/lib/bot-auth";

export async function GET(request: Request) {
  const authError = await verifyBotAuth(request);
  if (authError) return authError;

  return NextResponse.json({ ok: true, version: "1" });
}
