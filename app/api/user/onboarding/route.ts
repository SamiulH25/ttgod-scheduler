import { NextResponse } from "next/server";
import { requireSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { handleApiError } from "@/lib/api-response";

export async function GET() {
  try {
    const { user, error } = await requireSession();
    if (error) return error;

    const [availabilityCount, campaignCount, onboardingCompleted] =
      await Promise.all([
        prisma.availabilityBlock.count({ where: { userId: user!.id } }),
        prisma.eventParticipant.count({ where: { userId: user!.id } }),
        prisma.user.findUnique({
          where: { id: user!.id },
          select: { onboardingCompleted: true },
        }),
      ]);

    return NextResponse.json({
      steps: {
        timezoneSet: Boolean(user!.timezone && user!.timezone !== "UTC"),
        hasAvailability: availabilityCount > 0,
        joinedCampaign: campaignCount > 0,
        onboardingMarkedDone: onboardingCompleted?.onboardingCompleted ?? false,
      },
    });
  } catch (err) {
    return handleApiError(err);
  }
}

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
