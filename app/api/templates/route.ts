import { NextRequest, NextResponse } from "next/server";
import { requireSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { handleApiError } from "@/lib/api-response";
import { campaignTemplateCreateSchema } from "@/lib/validations";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const { user, error } = await requireSession();
    if (error) return error;

    const templates = await prisma.campaignTemplate.findMany({
      where: { createdById: user!.id },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json({ templates });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function POST(request: NextRequest) {
  try {
    const { user, error } = await requireSession();
    if (error) return error;

    const body = campaignTemplateCreateSchema.parse(await request.json());

    const template = await prisma.campaignTemplate.create({
      data: {
        createdById: user!.id,
        title: body.title,
        description: body.description ?? undefined,
        durationMinutes: body.durationMinutes ?? 120,
        visibility: body.visibility ?? "private",
        maxParticipants: body.maxParticipants ?? undefined,
        costSplitEvenly: body.costSplitEvenly ?? false,
        defaultPhase: body.defaultPhase ?? "interest",
      },
    });

    return NextResponse.json({ template }, { status: 201 });
  } catch (err) {
    return handleApiError(err);
  }
}
