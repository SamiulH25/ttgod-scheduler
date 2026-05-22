import { NextResponse } from "next/server";
import { requireSession } from "@/lib/auth";
import { handleApiError } from "@/lib/api-response";
import { prisma } from "@/lib/db";

export async function PATCH() {
  try {
    const { user, error } = await requireSession();
    if (error) return error;

    await prisma.user.update({
      where: { id: user!.id },
      data: { onboardingCompleted: true },
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    return handleApiError(err);
  }
}
