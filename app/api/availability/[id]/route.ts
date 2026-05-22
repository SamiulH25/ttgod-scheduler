import { NextRequest, NextResponse } from "next/server";

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

              },

            });

          })

        : await prisma.availabilityBlock.update({

            where: { id },

            data: { start, end, label: body.label },

          });



    return NextResponse.json({ block });

  } catch (err) {

    return handleApiError(err);

  }

}



export async function DELETE(_request: NextRequest, { params }: Params) {

  try {

    const { user, error } = await requireSession();

    if (error) return error;



    const { id } = await params;

    const existing = await prisma.availabilityBlock.findFirst({

      where: { id, userId: user!.id },

    });

    if (!existing) {

      return jsonError("Block not found", "NOT_FOUND", 404);

    }



    await prisma.availabilityBlock.delete({ where: { id } });

    return NextResponse.json({ ok: true });

  } catch (err) {

    return handleApiError(err);

  }

}

