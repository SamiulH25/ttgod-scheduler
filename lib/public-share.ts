import { randomBytes } from "crypto";
import { prisma } from "@/lib/db";

export const SHARE_TOKEN_TYPES = {
  publicWeek: "public_week",
  eventInvite: "event_invite",
} as const;

export function generatePublicShareToken(): string {
  return randomBytes(28).toString("base64url");
}

export async function createPublicWeekShareToken(args: {
  guildId: string;
  createdById: string;
  expiresAt?: Date | null;
}): Promise<{ id: string; token: string }> {
  for (let attempt = 0; attempt < 8; attempt++) {
    const token = generatePublicShareToken();
    try {
      const row = await prisma.publicShareToken.create({
        data: {
          type: SHARE_TOKEN_TYPES.publicWeek,
          token,
          guildId: args.guildId,
          createdById: args.createdById,
          expiresAt: args.expiresAt ?? null,
        },
        select: { id: true, token: true },
      });
      return row;
    } catch {
      // unique collision on token
    }
  }
  throw new Error("Could not allocate share token");
}

export async function createEventInviteShareToken(args: {
  eventId: string;
  guildId: string | null;
  createdById: string;
  expiresAt?: Date | null;
}): Promise<{ id: string; token: string }> {
  for (let attempt = 0; attempt < 8; attempt++) {
    const token = generatePublicShareToken();
    try {
      const row = await prisma.publicShareToken.create({
        data: {
          type: SHARE_TOKEN_TYPES.eventInvite,
          token,
          guildId: args.guildId,
          eventId: args.eventId,
          createdById: args.createdById,
          expiresAt: args.expiresAt ?? null,
        },
        select: { id: true, token: true },
      });
      return row;
    } catch {
      // collision
    }
  }
  throw new Error("Could not allocate invite token");
}

export type VerifiedWeekToken = {
  type: typeof SHARE_TOKEN_TYPES.publicWeek;
  guildId: string;
  token: string;
};

export async function verifyPublicWeekToken(
  token: string,
): Promise<VerifiedWeekToken | null> {
  if (!token || token.length < 12) return null;
  const row = await prisma.publicShareToken.findFirst({
    where: {
      token,
      type: SHARE_TOKEN_TYPES.publicWeek,
    },
    select: { guildId: true, expiresAt: true, type: true },
  });
  if (!row?.guildId) return null;
  if (row.expiresAt && row.expiresAt < new Date()) return null;
  return { type: SHARE_TOKEN_TYPES.publicWeek, guildId: row.guildId, token };
}

export type VerifiedInviteToken = {
  type: typeof SHARE_TOKEN_TYPES.eventInvite;
  eventId: string;
  token: string;
};

export async function verifyEventInviteToken(
  token: string,
): Promise<VerifiedInviteToken | null> {
  if (!token || token.length < 12) return null;
  const row = await prisma.publicShareToken.findFirst({
    where: {
      token,
      type: SHARE_TOKEN_TYPES.eventInvite,
    },
    select: { eventId: true, expiresAt: true },
  });
  if (!row?.eventId) return null;
  if (row.expiresAt && row.expiresAt < new Date()) return null;
  return { type: SHARE_TOKEN_TYPES.eventInvite, eventId: row.eventId, token };
}
