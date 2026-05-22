import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { jsonError } from "@/lib/api-response";

export async function requireSession() {
  const session = await auth();
  if (!session?.user?.id) {
    return { session: null, user: null, error: jsonError("Unauthorized", "UNAUTHORIZED", 401) };
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
  });

  if (!user) {
    return { session: null, user: null, error: jsonError("User not found", "NOT_FOUND", 404) };
  }

  return { session, user, error: null };
}
