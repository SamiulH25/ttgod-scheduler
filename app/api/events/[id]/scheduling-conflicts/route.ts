import { NextRequest, NextResponse } from "next/server";
import { requireSession } from "@/lib/auth";
import { handleApiError } from "@/lib/api-response";
import { getEventForUser } from "@/lib/event-access";
import { findSchedulingConflicts } from "@/lib/scheduling-conflicts";

type Params = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, { params }: Params) {
  try {
    const { user, error } = await requireSession();
    if (error) return error;
    const { id } = await params;
    const event = await getEventForUser(id, user!.id);
    if (!event) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    const start = request.nextUrl.searchParams.get("start");
    const end = request.nextUrl.searchParams.get("end");
    if (!start || !end) {
      return NextResponse.json({ error: "start and end required" }, { status: 400 });
    }
    const conflicts = await findSchedulingConflicts(
      new Date(start),
      new Date(end),
    );
    return NextResponse.json({ conflicts });
  } catch (err) {
    return handleApiError(err);
  }
}
