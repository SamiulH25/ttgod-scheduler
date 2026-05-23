import { NextRequest, NextResponse } from "next/server";
import { logActivity } from "@/lib/activity";
import { requireSession } from "@/lib/auth";
import { handleApiError } from "@/lib/api-response";
import { duplicateEvent } from "@/lib/duplicate-event";

type Params = { params: Promise<{ id: string }> };

export async function POST(_request: NextRequest, { params }: Params) {
  try {
    const { user, error } = await requireSession();
    if (error) return error;

    const { id } = await params;
    const event = await duplicateEvent(id, user!.id);
    if (!event) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    await logActivity({
      type: "event.duplicated",
      actorId: user!.id,
      entityType: "event",
      entityId: event.id,
      metadata: { sourceId: id },
    });

    return NextResponse.json({ event: { id: event.id, title: event.title } });
  } catch (err) {
    return handleApiError(err);
  }
}
