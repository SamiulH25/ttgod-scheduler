import { NextResponse } from "next/server";
import { requireSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { handleApiError } from "@/lib/api-response";
import { preferencesSchema } from "@/lib/validations";

export async function GET() {
  try {
    const { user, error } = await requireSession();
    if (error) return error;

    return NextResponse.json({
      timezone: user!.timezone,
      theme: user!.theme,
      font: user!.font,
    });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function PATCH(request: Request) {
  try {
    const { user, error } = await requireSession();
    if (error) return error;

    const body = preferencesSchema.parse(await request.json());

    const updated = await prisma.user.update({
      where: { id: user!.id },
      data: {
        ...(body.timezone !== undefined && { timezone: body.timezone }),
        ...(body.theme !== undefined && { theme: body.theme }),
        ...(body.font !== undefined && { font: body.font }),
      },
    });

    return NextResponse.json({
      timezone: updated.timezone,
      theme: updated.theme,
      font: updated.font,
    });
  } catch (err) {
    return handleApiError(err);
  }
}
