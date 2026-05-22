import { NextRequest, NextResponse } from "next/server";

import { requireSession } from "@/lib/auth";

import { prisma } from "@/lib/db";

import { computeCombinedOwnBlock } from "@/lib/availability";

import { handleApiError } from "@/lib/api-response";

import { parseRangeParams } from "@/lib/dates";

import { availabilityCreateSchema } from "@/lib/validations";



export async function GET(request: NextRequest) {

  try {

    const { error } = await requireSession();

    if (error) return error;



    const { searchParams } = request.nextUrl;

    const { from, to } = parseRangeParams(

      searchParams.get("from"),

      searchParams.get("to"),

    );



    const blocks = await prisma.availabilityBlock.findMany({

      where: {

        start: { lt: to },

        end: { gt: from },

      },

      include: {

        user: {

          select: { id: true, name: true, image: true },

        },

      },

      orderBy: { start: "asc" },

    });



    return NextResponse.json({ blocks });

  } catch (err) {

    return handleApiError(err);

  }

}



export async function POST(request: NextRequest) {

  try {

    const { user, error } = await requireSession();

    if (error) return error;



    const body = availabilityCreateSchema.parse(await request.json());

    const start = new Date(body.start);

    const end = new Date(body.end);



    const existing = await prisma.availabilityBlock.findMany({

      where: { userId: user!.id },

    });



    const { overlapping, combinedStart, combinedEnd } = computeCombinedOwnBlock(

      existing,

      start,

      end,

    );



    const block =

      overlapping.length > 0

        ? await prisma.$transaction(async (tx) => {

            await tx.availabilityBlock.deleteMany({

              where: { id: { in: overlapping.map((b) => b.id) } },

            });

            return tx.availabilityBlock.create({

              data: {

                userId: user!.id,

                start: combinedStart,

                end: combinedEnd,

                label: body.label,

              },

            });

          })

        : await prisma.availabilityBlock.create({

            data: {

              userId: user!.id,

              start,

              end,

              label: body.label,

            },

          });



    await prisma.user.update({

      where: { id: user!.id },

      data: { onboardingCompleted: true },

    });



    return NextResponse.json({ block }, { status: 201 });

  } catch (err) {

    return handleApiError(err);

  }

}

