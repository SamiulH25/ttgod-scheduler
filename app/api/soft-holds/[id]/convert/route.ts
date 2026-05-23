import { NextRequest, NextResponse } from "next/server";
import { logActivity } from "@/lib/activity";
import { requireSession } from "@/lib/auth";
import { handleApiError, jsonError } from "@/lib/api-response";
import { convertSoftHoldToEvent } from "@/lib/soft-holds";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string }> };

export async function POST(_request: NextRequest, { params }: Params) {
  try {
    const { user, error } = await requireSession();
    if (error) return error;

    const { id } = await params;
    const result = await convertSoftHoldToEvent({ holdId: id, userId: user!.id });
    if (!result.ok) {
      if (result.reason === "expired") {
        return jsonError("Hold expired", "GONE", 410);
      }
      return jsonError("Hold not found", "NOT_FOUND", 404);
    }

    await logActivity({
      type: "soft_hold.converted",
      actorId: user!.id,
      entityType: "soft_hold",
      entityId: id,
      metadata: { eventId: result.eventId },
    });

    return NextResponse.json({ eventId: result.eventId });
  } catch (err) {
    return handleApiError(err);
  }
}
