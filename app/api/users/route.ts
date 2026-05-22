import { NextResponse } from "next/server";
import { requireSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { handleApiError } from "@/lib/api-response";

export async function GET() {
  try {
    const { user, error } = await requireSession();
    if (error) return error;

    const users = await prisma.user.findMany({
      where: {
        id: { not: user!.id },
        discordId: { not: null },
      },
      select: { id: true, name: true, image: true, discordId: true },
      orderBy: { name: "asc" },
    });

    return NextResponse.json({ users });
  } catch (err) {
    return handleApiError(err);
  }
}
