import { NextRequest, NextResponse } from "next/server";
import { requireSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getEventForUser } from "@/lib/event-access";
import { readEventImage } from "@/lib/event-upload";
import { getEnv } from "@/lib/env";
import { handleApiError, jsonError } from "@/lib/api-response";

type Params = { params: Promise<{ id: string; imageId: string }> };

export async function GET(_request: NextRequest, { params }: Params) {
  try {
    const { user, error } = await requireSession();
    if (error) return error;

    const { id: eventId, imageId } = await params;
    const event = await getEventForUser(eventId, user!.id);
    if (!event) {
      return jsonError("Event not found", "NOT_FOUND", 404);
    }

    const image = await prisma.eventImage.findFirst({
      where: { eventId, storageKey: imageId },
    });
    if (!image) {
      return jsonError("Image not found", "NOT_FOUND", 404);
    }

    const env = getEnv();
    if (
      env.UPLOAD_STORAGE === "s3" &&
      image.url.startsWith("http")
    ) {
      return NextResponse.redirect(image.url, { status: 302 });
    }

    const data = await readEventImage(eventId, image.storageKey);

    return new NextResponse(new Uint8Array(data), {
      headers: {
        "Content-Type": image.mimeType,
        "Cache-Control": "private, max-age=3600",
      },
    });
  } catch (err) {
    return handleApiError(err);
  }
}
