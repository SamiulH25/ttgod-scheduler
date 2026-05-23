import { NextRequest, NextResponse } from "next/server";
import { requireSession } from "@/lib/auth";
import { handleApiError, jsonError } from "@/lib/api-response";
import { deleteSoftHoldIfOwner } from "@/lib/soft-holds";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string }> };

export async function DELETE(_request: NextRequest, { params }: Params) {
  try {
    const { user, error } = await requireSession();
    if (error) return error;

    const { id } = await params;
    const result = await deleteSoftHoldIfOwner(id, user!.id);
    if (!result.ok) {
      return jsonError("Hold not found or already converted", "NOT_FOUND", 404);
    }
    return NextResponse.json({ ok: true });
  } catch (err) {
    return handleApiError(err);
  }
}
