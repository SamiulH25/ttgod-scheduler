import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireSession } from "@/lib/auth";
import { handleApiError } from "@/lib/api-response";
import { requireEventHost } from "@/lib/event-access";
import { createEventInviteShareToken } from "@/lib/public-share";

type Params = { params: Promise<{ id: string }> };

const postSchema = z.object({
  expiresAt: z.string().datetime({ offset: true }).optional().nullable(),
});

export async function POST(request: NextRequest, { params }: Params) {
  try {
    const { user, error } = await requireSession();
    if (error) return error;

    const { id: eventId } = await params;
    const hostCheck = await requireEventHost(eventId, user!.id);
    if (hostCheck.error) return hostCheck.error;

    const event = hostCheck.event!;
    const body = postSchema.parse(await request.json());
    const expiresAt = body.expiresAt ? new Date(body.expiresAt) : null;

    const row = await createEventInviteShareToken({
      eventId,
      guildId: event.guildId ?? null,
      createdById: user!.id,
      expiresAt,
    });

    return NextResponse.json({
      token: row.token,
      url: `/public/invite/${encodeURIComponent(row.token)}`,
    });
  } catch (err) {
    return handleApiError(err);
  }
}
