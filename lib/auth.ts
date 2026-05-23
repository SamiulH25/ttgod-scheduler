import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { jsonError } from "@/lib/api-response";

export type ApiSessionUser = {
  id: string;
  discordId: string | null;
  timezone: string;
  theme: string;
  font: string;
  name: string | null;
  email: string | null;
  image: string | null;
  onboardingCompleted: boolean;
};

function userFromSession(session: {
  user: {
    id: string;
    discordId: string;
    timezone: string;
    theme: string;
    font: string;
    name?: string | null;
    email?: string | null;
    image?: string | null;
    onboardingCompleted?: boolean;
  };
}): ApiSessionUser {
  return {
    id: session.user.id,
    discordId: session.user.discordId || null,
    timezone: session.user.timezone,
    theme: session.user.theme,
    font: session.user.font,
    name: session.user.name ?? null,
    email: session.user.email ?? null,
    image: session.user.image ?? null,
    onboardingCompleted: session.user.onboardingCompleted ?? false,
  };
}

export async function requireSession() {
  const session = await auth();
  if (!session?.user?.id) {
    return {
      session: null,
      user: null,
      error: jsonError("Unauthorized", "UNAUTHORIZED", 401),
    };
  }

  return { session, user: userFromSession(session), error: null };
}

/** When APIs need DB-only fields not stored on the JWT yet. */
export async function requireSessionDbUser() {
  const base = await requireSession();
  if (base.error) return base;

  const dbUser = await prisma.user.findUnique({
    where: { id: base.user!.id },
  });

  if (!dbUser) {
    return {
      session: null,
      user: null,
      error: jsonError("User not found", "NOT_FOUND", 404),
    };
  }

  return { session: base.session, user: dbUser, error: null };
}
