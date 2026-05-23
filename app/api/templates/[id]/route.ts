import { NextRequest, NextResponse } from "next/server";
import { requireSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { handleApiError, jsonError } from "@/lib/api-response";
import { campaignTemplateUpdateSchema } from "@/lib/validations";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, { params }: Params) {
  try {
    const { user, error } = await requireSession();
    if (error) return error;

    const { id } = await params;
    const template = await prisma.campaignTemplate.findFirst({
      where: { id, createdById: user!.id },
    });
    if (!template) {
      return jsonError("Template not found", "NOT_FOUND", 404);
    }
    return NextResponse.json({ template });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function PATCH(request: NextRequest, { params }: Params) {
  try {
    const { user, error } = await requireSession();
    if (error) return error;

    const { id } = await params;
    const existing = await prisma.campaignTemplate.findFirst({
      where: { id, createdById: user!.id },
    });
    if (!existing) {
      return jsonError("Template not found", "NOT_FOUND", 404);
    }

    const body = campaignTemplateUpdateSchema.parse(await request.json());

    const template = await prisma.campaignTemplate.update({
      where: { id },
      data: {
        title: body.title ?? undefined,
        description: body.description === undefined ? undefined : body.description,
        durationMinutes: body.durationMinutes ?? undefined,
        visibility: body.visibility ?? undefined,
        maxParticipants: body.maxParticipants ?? undefined,
        costSplitEvenly: body.costSplitEvenly ?? undefined,
        defaultPhase: body.defaultPhase ?? undefined,
      },
    });

    return NextResponse.json({ template });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function DELETE(_request: NextRequest, { params }: Params) {
  try {
    const { user, error } = await requireSession();
    if (error) return error;

    const { id } = await params;
    const existing = await prisma.campaignTemplate.findFirst({
      where: { id, createdById: user!.id },
    });
    if (!existing) {
      return jsonError("Template not found", "NOT_FOUND", 404);
    }

    await prisma.campaignTemplate.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (err) {
    return handleApiError(err);
  }
}
