import { NextRequest, NextResponse } from "next/server";

import { logActivity } from "@/lib/activity";
import { requireSession } from "@/lib/auth";

import { prisma } from "@/lib/db";

import { computeCombinedOwnBlock } from "@/lib/availability";

import { handleApiError, jsonError } from "@/lib/api-response";

import { availabilityUpdateSchema } from "@/lib/validations";



type Params = { params: Promise<{ id: string }> };



export async function PATCH(request: NextRequest, { params }: Params) {

  try {

    const { user, error } = await requireSession();

    if (error) return error;



    const { id } = await params;

    const body = availabilityUpdateSchema.parse(await request.json());

    const start = new Date(body.start);

    const end = new Date(body.end);



    const existing = await prisma.availabilityBlock.findFirst({

      where: { id, userId: user!.id },

    });

    if (!existing) {

      return jsonError("Block not found", "NOT_FOUND", 404);

    }



    const allBlocks = await prisma.availabilityBlock.findMany({

      where: { userId: user!.id },

    });



    const { overlapping, combinedStart, combinedEnd } = computeCombinedOwnBlock(

      allBlocks,

      start,

      end,

      id,

    );



    const block =

      overlapping.length > 0

        ? await prisma.$transaction(async (tx) => {

            await tx.availabilityBlock.deleteMany({

              where: { id: { in: overlapping.map((b) => b.id) } },

            });

            return tx.availabilityBlock.update({

              where: { id },

              data: {

                start: combinedStart,

                end: combinedEnd,

                label: body.label,

                status: body.status ?? undefined,

                lfgNote: body.lfgNote === undefined ? undefined : body.lfgNote,

                recurrenceRule:

                  body.recurrenceRule === undefined ? undefined : body.recurrenceRule,

                seriesId: body.seriesId === undefined ? undefined : body.seriesId,

              },

            });

          })

        : await prisma.availabilityBlock.update({

            where: { id },

            data: {

              start,

              end,

              label: body.label,

              status: body.status ?? undefined,

              lfgNote: body.lfgNote === undefined ? undefined : body.lfgNote,

              recurrenceRule:

                body.recurrenceRule === undefined ? undefined : body.recurrenceRule,

              seriesId: body.seriesId === undefined ? undefined : body.seriesId,

            },

          });



    await logActivity({
      type: "availability.updated",
      actorId: user!.id,
      entityType: "availability_block",
      entityId: block.id,
      metadata: { merged: overlapping.length > 0 },
    });

    return NextResponse.json({
      block,
      merged: overlapping.length > 0,
    });

  } catch (err) {

    return handleApiError(err);

  }

}



export async function DELETE(_request: NextRequest, { params }: Params) {

  try {

    const { user, error } = await requireSession();

    if (error) return error;



    const { id } = await params;

    const deleted = await prisma.availabilityBlock.deleteMany({

      where: { id, userId: user!.id },

    });

    if (deleted.count === 0) {

      return jsonError("Block not found", "NOT_FOUND", 404);

    }

    await logActivity({
      type: "availability.deleted",
      actorId: user!.id,
      entityType: "availability_block",
      entityId: id,
    });

    return NextResponse.json({ ok: true });

  } catch (err) {

    return handleApiError(err);

  }

}

