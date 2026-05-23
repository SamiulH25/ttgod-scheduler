import { NextRequest, NextResponse } from "next/server";
import { listActivities } from "@/lib/activity";
import { requireSession } from "@/lib/auth";
import { handleApiError } from "@/lib/api-response";

export async function GET(request: NextRequest) {
  try {
    const { error } = await requireSession();
    if (error) return error;

    const entityType = request.nextUrl.searchParams.get("entityType") ?? undefined;
    const cursor = request.nextUrl.searchParams.get("cursor") ?? undefined;
    const activities = await listActivities({ entityType, cursor });

    return NextResponse.json({
      activities: activities.map((a) => ({
        ...a,
        createdAt: a.createdAt.toISOString(),
        metadata: a.metadata ? JSON.parse(a.metadata) : null,
      })),
    });
  } catch (err) {
    return handleApiError(err);
  }
}
