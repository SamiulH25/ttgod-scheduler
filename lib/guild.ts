import { randomBytes } from "crypto";
import { prisma } from "@/lib/db";

const DEFAULT_GUILD_NAME = "Home guild";

function randomJoinCode(): string {
  return randomBytes(5).toString("hex").slice(0, 8).toUpperCase();
}

/** Allocate a unique join code for a guild (retries on collision). */
export async function allocateGuildJoinCode(guildId: string): Promise<string> {
  for (let i = 0; i < 10; i++) {
    const joinCode = randomJoinCode();
    try {
      await prisma.guild.update({
        where: { id: guildId },
        data: { joinCode },
      });
      return joinCode;
    } catch {
      // unique collision on joinCode — retry
    }
  }
  throw new Error("Could not allocate join code");
}

/** First-time users get a personal guild row + membership (optional seed). */
export async function ensureDefaultGuildForUser(userId: string): Promise<void> {
  const member = await prisma.guildMember.findFirst({ where: { userId } });
  if (member) return;

  const guild = await prisma.guild.create({
    data: { name: DEFAULT_GUILD_NAME },
  });
  await prisma.guildMember.create({
    data: { guildId: guild.id, userId, role: "admin" },
  });
  await prisma.user.update({
    where: { id: userId },
    data: { lastGuildId: guild.id },
  });
}

export async function listGuildsForUser(userId: string) {
  const rows = await prisma.guildMember.findMany({
    where: { userId },
    include: { guild: { select: { id: true, name: true, joinCode: true } } },
    orderBy: { createdAt: "asc" },
  });
  return rows.map((r) => r.guild);
}

export async function setUserActiveGuild(
  userId: string,
  guildId: string,
): Promise<void> {
  const ok = await prisma.guildMember.findFirst({
    where: { userId, guildId },
  });
  if (!ok) throw new Error("NOT_MEMBER");
  await prisma.user.update({
    where: { id: userId },
    data: { lastGuildId: guildId },
  });
}
