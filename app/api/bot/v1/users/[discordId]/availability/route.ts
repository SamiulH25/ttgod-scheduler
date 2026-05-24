import { NextRequest, NextResponse } from "next/server";
import { verifyBotAuth } from "@/lib/bot-auth";
import { getUserByDiscordId } from "@/lib/bot-user";
import { prisma } from "@/lib/db";
import { findOverlappingBlock } from "@/lib/availability";
import { handleApiError, jsonError } from "@/lib/api-response";
import { parseRangeParams } from "@/lib/dates";
import { availabilityBulkSchema, rangeQuerySchema } from "@/lib/validations";

type Params = { params: Promise<{ discordId: string }> };

export async function GET(request: NextRequest, { params }: Params) {
  const authError = await verifyBotAuth(request);
  if (authError) return authError;

  try {
    const { discordId } = await params;
    const { user, error } = await getUserByDiscordId(discordId);
    if (error) return error;

    const { searchParams } = request.nextUrl;
    rangeQuerySchema.parse({
      from: searchParams.get("from") ?? undefined,
      to: searchParams.get("to") ?? undefined,
    });

    const { from, to } = parseRangeParams(
      searchParams.get("from"),
      searchParams.get("to"),
    );

    const blocks = await prisma.availabilityBlock.findMany({
      where: {
        userId: user!.id,
        start: { lt: to },
        end: { gt: from },
      },
      orderBy: { start: "asc" },
    });

    return NextResponse.json({ blocks });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function PUT(request: NextRequest, { params }: Params) {
  const authError = await verifyBotAuth(request);
  if (authError) return authError;

  try {
    const { discordId } = await params;
    const { user, error } = await getUserByDiscordId(discordId);
    if (error) return error;

    const body = availabilityBulkSchema.parse(await request.json());
    const parsed = body.blocks.map((b) => ({
      start: new Date(b.start),
      end: new Date(b.end),
      label: b.label,
      status: b.status ?? "free",
      recurrenceRule: b.recurrenceRule ?? undefined,
      seriesId: b.seriesId ?? undefined,
    }));

    for (let i = 0; i < parsed.length; i++) {
      if (parsed[i].end <= parsed[i].start) {
        return jsonError("End must be after start", "VALIDATION_ERROR", 400);
      }
      for (let j = i + 1; j < parsed.length; j++) {
        if (
          findOverlappingBlock(
            [{ id: "a", start: parsed[i].start, end: parsed[i].end }],
            parsed[j].start,
            parsed[j].end,
          )
        ) {
          return jsonError("Blocks in payload overlap", "OVERLAP", 409);
        }
      }
    }

    const blocks = await prisma.$transaction(async (tx) => {
      await tx.availabilityBlock.deleteMany({ where: { userId: user!.id } });
      if (parsed.length === 0) return [];
      await tx.availabilityBlock.createMany({
        data: parsed.map((b) => ({
          userId: user!.id,
          start: b.start,
          end: b.end,
          label: b.label,
          status: b.status,
          recurrenceRule: b.recurrenceRule,
          seriesId: b.seriesId,
        })),
      });
      return tx.availabilityBlock.findMany({
        where: { userId: user!.id },
        orderBy: { start: "asc" },
      });
    });

    return NextResponse.json({ blocks });
  } catch (err) {
    return handleApiError(err);
  }
}
