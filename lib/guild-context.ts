import { prisma } from "@/lib/db";

export async function resolveActiveGuildId(userId: string): Promise<string | null> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { lastGuildId: true },
  });
  if (!user?.lastGuildId) {
    const membership = await prisma.guildMember.findFirst({
      where: { userId },
      orderBy: { createdAt: "asc" },
      select: { guildId: true },
    });
    return membership?.guildId ?? null;
  }

  const member = await prisma.guildMember.findUnique({
    where: {
      guildId_userId: { guildId: user.lastGuildId, userId },
    },
  });
  if (member) return user.lastGuildId;

  const fallback = await prisma.guildMember.findFirst({
    where: { userId },
    select: { guildId: true },
  });
  return fallback?.guildId ?? null;
}

export async function setActiveGuild(userId: string, guildId: string): Promise<boolean> {
  const member = await prisma.guildMember.findUnique({
    where: { guildId_userId: { guildId, userId } },
  });
  if (!member) return false;
  await prisma.user.update({
    where: { id: userId },
    data: { lastGuildId: guildId },
  });
  return true;
}

export async function guildMemberUserIds(guildId: string): Promise<string[]> {
  const rows = await prisma.guildMember.findMany({
    where: { guildId },
    select: { userId: true },
  });
  return rows.map((r) => r.userId);
}
