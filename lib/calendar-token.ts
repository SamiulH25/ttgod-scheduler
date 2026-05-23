import { randomBytes } from "crypto";
import { prisma } from "@/lib/db";

export function generateCalendarToken(): string {
  return randomBytes(32).toString("base64url");
}

/** Returns existing token or creates a new opaque calendar subscription token. */
export async function ensureUserCalendarToken(userId: string): Promise<string> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { calendarToken: true },
  });
  if (user?.calendarToken) return user.calendarToken;

  for (let attempt = 0; attempt < 5; attempt++) {
    const token = generateCalendarToken();
    try {
      await prisma.user.update({
        where: { id: userId },
        data: { calendarToken: token },
      });
      return token;
    } catch {
      // rare collision on calendarToken unique — retry
    }
  }
  throw new Error("Could not allocate calendar token");
}

export async function rotateUserCalendarToken(userId: string): Promise<string> {
  for (let attempt = 0; attempt < 5; attempt++) {
    const token = generateCalendarToken();
    try {
      await prisma.user.update({
        where: { id: userId },
        data: { calendarToken: token },
      });
      return token;
    } catch {
      // collision
    }
  }
  throw new Error("Could not rotate calendar token");
}

export async function findUserByCalendarToken(
  token: string,
): Promise<{ id: string; timezone: string } | null> {
  if (!token || token.length < 16) return null;
  return prisma.user.findFirst({
    where: { calendarToken: token },
    select: { id: true, timezone: true },
  });
}
