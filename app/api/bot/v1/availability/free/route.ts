import { NextRequest, NextResponse } from "next/server";
import { verifyBotAuth } from "@/lib/bot-auth";
import { handleApiError } from "@/lib/api-response";
import {
  findUsersFreeDuring,
  notifyTargetsForBot,
} from "@/lib/event-availability";
import { freeUsersQuerySchema } from "@/lib/validations";

export async function GET(request: NextRequest) {
  const authError = verifyBotAuth(request);
  if (authError) return authError;

  try {
    const { searchParams } = request.nextUrl;
    const { start, end } = freeUsersQuerySchema.parse({
      start: searchParams.get("start"),
      end: searchParams.get("end"),
    });

    const notifyTargets = await findUsersFreeDuring(
      new Date(start),
      new Date(end),
    );

    return NextResponse.json({
      notifyTargets,
      pingTargets: notifyTargetsForBot(notifyTargets),
      count: notifyTargets.length,
    });
  } catch (err) {
    return handleApiError(err);
  }
}
