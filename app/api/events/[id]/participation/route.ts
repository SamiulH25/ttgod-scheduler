import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { handleApiError, jsonError } from "@/lib/api-response";

const statusSchema = z.object({
  status: z.enum(["accepted", "declined"]),
});

type Params = { params: Promise<{ id: string }> };

export async function PATCH(request: NextRequest, { params }: Params) {
  try {
    const { user, error } = await requireSession();
    if (error) return error;

    const { id: eventId } = await params;
    const { status } = statusSchema.parse(await request.json());

    const participation = await prisma.eventParticipant.findUnique({
      where: { eventId_userId: { eventId, userId: user!.id } },
    });

    if (!participation) {
      return jsonError("Invitation not found", "NOT_FOUND", 404);
    }

    const updated = await prisma.eventParticipant.update({
      where: { eventId_userId: { eventId, userId: user!.id } },
      data: { status },
    });

    return NextResponse.json({ participation: updated });
  } catch (err) {
    return handleApiError(err);
  }
}
