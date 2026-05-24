import { NextRequest, NextResponse } from "next/server";
import { requireSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getEventForUser, eventInclude } from "@/lib/event-access";
import { saveEventImage } from "@/lib/event-upload";
import { checkUserWriteRateLimit } from "@/lib/user-rate-limit";
import { handleApiError, jsonError } from "@/lib/api-response";

type Params = { params: Promise<{ id: string }> };

export async function POST(request: NextRequest, { params }: Params) {
  try {
    const { user, error } = await requireSession();
    if (error) return error;

    const rateLimited = await checkUserWriteRateLimit(
      user!.id,
      "event-image-upload",
      30,
    );
    if (rateLimited) return rateLimited;

    const { id: eventId } = await params;
    const event = await getEventForUser(eventId, user!.id);
    if (!event) {
      return jsonError("Event not found", "NOT_FOUND", 404);
    }

    const formData = await request.formData();
    const file = formData.get("file");
    if (!(file instanceof File)) {
      return jsonError("Missing file", "BAD_REQUEST", 400);
    }

    let saved: Awaited<ReturnType<typeof saveEventImage>>;
    try {
      saved = await saveEventImage(eventId, file);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Upload failed";
      return jsonError(msg, "BAD_REQUEST", 400);
    }

    const image = await prisma.eventImage.create({
      data: {
        eventId,
        storageKey: saved.storageKey,
        url: saved.url,
        mimeType: saved.mimeType,
        uploadedById: user!.id,
      },
      include: {
        uploadedBy: { select: { id: true, name: true, image: true } },
      },
    });

    const full = await prisma.event.findUnique({
      where: { id: eventId },
      include: eventInclude,
    });

    return NextResponse.json({ image, event: full }, { status: 201 });
  } catch (err) {
    return handleApiError(err);
  }
}
