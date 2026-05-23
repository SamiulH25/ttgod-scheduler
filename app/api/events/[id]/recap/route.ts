import { NextResponse } from "next/server";
import { requireSession } from "@/lib/auth";
import { getEventForUser } from "@/lib/event-access";
import { handleApiError, jsonError } from "@/lib/api-response";
import { aggregateEventRecap } from "@/lib/event-recap";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: Request, { params }: Params) {
  try {
    const { user, error } = await requireSession();
    if (error) return error;

    const { id } = await params;
    const event = await getEventForUser(id, user!.id);
    if (!event) {
      return jsonError("Event not found", "NOT_FOUND", 404);
    }
    if (!event.archivedAt) {
      return jsonError("Recap is for archived events", "BAD_REQUEST", 400);
    }

    const recap = await aggregateEventRecap(id);
    return NextResponse.json({ recap });
  } catch (err) {
    return handleApiError(err);
  }
}
