import { NextRequest, NextResponse } from "next/server";
import { requireSession } from "@/lib/auth";
import { handleApiError } from "@/lib/api-response";
import { findUsersFreeDuring } from "@/lib/event-availability";
import { freeUsersQuerySchema } from "@/lib/validations";

export async function GET(request: NextRequest) {
  try {
    const { error } = await requireSession();
    if (error) return error;

    const { searchParams } = request.nextUrl;
    const { start, end } = freeUsersQuerySchema.parse({
      start: searchParams.get("start"),
      end: searchParams.get("end"),
    });

    const notifyTargets = await findUsersFreeDuring(
      new Date(start),
      new Date(end),
    );

    return NextResponse.json({ notifyTargets, count: notifyTargets.length });
  } catch (err) {
    return handleApiError(err);
  }
}
