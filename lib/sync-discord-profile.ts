import { prisma } from "@/lib/db";

export type DiscordProfileSlice = {
  avatar?: string | null;
  username?: string | null;
  global_name?: string | null;
  image?: string | null;
  email?: string | null;
};

function discordProfileImage(
  discordId: string,
  profile: DiscordProfileSlice,
): string | undefined {
  if (profile.image) return profile.image;
  if (profile.avatar) {
    return `https://cdn.discordapp.com/avatars/${discordId}/${profile.avatar}.png`;
  }
  return undefined;
}

function discordDisplayName(
  profile: DiscordProfileSlice,
  fallback?: string | null,
): string | undefined {
  return profile.global_name ?? profile.username ?? fallback ?? undefined;
}

/** Sync Discord profile onto the Auth.js user row (adapter may not have created it yet). */
export async function syncDiscordProfileToUser(options: {
  discordId: string;
  profile: DiscordProfileSlice;
  userId?: string | null;
  providerAccountId?: string | null;
  fallbackName?: string | null;
  fallbackImage?: string | null;
}): Promise<string | null> {
  const {
    discordId,
    profile,
    userId,
    providerAccountId,
    fallbackName,
    fallbackImage,
  } = options;

  const data = {
    discordId,
    name: discordDisplayName(profile, fallbackName),
    image: discordProfileImage(discordId, profile) ?? fallbackImage ?? undefined,
  };

  let resolvedUserId = userId ?? null;
  if (resolvedUserId) {
    const exists = await prisma.user.findUnique({
      where: { id: resolvedUserId },
      select: { id: true },
    });
    if (!exists) resolvedUserId = null;
  }

  if (!resolvedUserId && providerAccountId) {
    const account = await prisma.account.findUnique({
      where: {
        provider_providerAccountId: {
          provider: "discord",
          providerAccountId,
        },
      },
      select: { userId: true },
    });
    resolvedUserId = account?.userId ?? null;
  }

  if (!resolvedUserId && profile.email) {
    const byEmail = await prisma.user.findUnique({
      where: { email: profile.email },
      select: { id: true },
    });
    resolvedUserId = byEmail?.id ?? null;
  }

  if (!resolvedUserId) {
    // Adapter creates the user during OAuth; signIn/jwt may run before the row exists.
    return null;
  }

  await prisma.user.update({
    where: { id: resolvedUserId },
    data,
  });
  return resolvedUserId;
}
