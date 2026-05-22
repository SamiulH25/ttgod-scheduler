import { prisma } from "@/lib/db";
import { jsonError } from "@/lib/api-response";
import type { NextResponse } from "next/server";

export async function getUserByDiscordId(
  discordId: string,
): Promise<
  | { user: NonNullable<Awaited<ReturnType<typeof prisma.user.findUnique>>>; error: null }
  | { user: null; error: NextResponse }
> {
  const user = await prisma.user.findUnique({
    where: { discordId },
  });

  if (!user) {
    return {
      user: null,
      error: jsonError(
        "User has not signed in to the website yet",
        "USER_NOT_LINKED",
        404,
      ),
    };
  }

  return { user, error: null };
}
