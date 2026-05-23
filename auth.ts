import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Discord from "next-auth/providers/discord";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { authConfig } from "@/auth.config";
import { getDiscordOAuthCredentials } from "@/lib/discord-oauth";
import {
  syncDiscordProfileToUser,
  type DiscordProfileSlice,
} from "@/lib/sync-discord-profile";
import { prisma } from "@/lib/db";
import { ensureDefaultGuildForUser } from "@/lib/guild";

const discordOAuth = getDiscordOAuthCredentials();

const devAuthEnabled = process.env.NODE_ENV === "development";

async function loadUserIntoToken(
  token: Record<string, unknown> & { sub?: string },
) {
  if (!token.sub) return token;

  const dbUser = await prisma.user.findUnique({
    where: { id: token.sub },
  });

  if (dbUser) {
    token.discordId = dbUser.discordId ?? "";
    token.timezone = dbUser.timezone;
    token.theme = dbUser.theme;
    token.font = dbUser.font;
    token.onboardingCompleted = dbUser.onboardingCompleted;
  }

  return token;
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  secret: process.env.AUTH_SECRET,
  trustHost: true,
  adapter: PrismaAdapter(prisma),
  providers: [
    ...(discordOAuth
      ? [
          Discord({
            clientId: discordOAuth.clientId,
            clientSecret: discordOAuth.clientSecret,
            // Link Discord OAuth when a dev/demo user already has the same email.
            allowDangerousEmailAccountLinking: devAuthEnabled,
          }),
        ]
      : []),
    ...(devAuthEnabled
      ? [
          Credentials({
            id: "dev",
            name: "Demo account",
            credentials: {
              name: { label: "Display name", type: "text" },
            },
            async authorize(credentials) {
              const name =
                (credentials?.name as string | undefined)?.trim() || "Demo User";
              const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").slice(0, 32);
              const discordId = `dev-${slug || "user"}`;

              const user = await prisma.user.upsert({
                where: { discordId },
                create: {
                  discordId,
                  name,
                  email: `${discordId}@dev.local`,
                },
                update: { name },
              });

              await ensureDefaultGuildForUser(user.id);

              return user;
            },
          }),
        ]
      : []),
  ],
  callbacks: {
    ...authConfig.callbacks,
    async jwt({ token, user, account, profile, trigger }) {
      if (user?.id) {
        token.sub = user.id;
      }

      if (account?.provider === "discord" && profile?.id) {
        const discordId = String(profile.id);
        const syncedUserId = await syncDiscordProfileToUser({
          discordId,
          profile: profile as DiscordProfileSlice,
          userId: token.sub ?? user?.id,
          providerAccountId: account.providerAccountId,
          fallbackName: user?.name,
          fallbackImage: user?.image,
        });
        if (syncedUserId) {
          token.sub = syncedUserId;
        }
        token.discordId = discordId;
      }

      if (token.sub && (user?.id || trigger === "update" || account?.provider === "discord")) {
        await loadUserIntoToken(token);
      }

      return token;
    },
    async signIn() {
      return true;
    },
  },
  events: {
    async signIn({ user, account, profile }) {
      if (user?.id) {
        await ensureDefaultGuildForUser(user.id);
      }
      if (account?.provider !== "discord" || !profile || !("id" in profile)) return;
      await syncDiscordProfileToUser({
        discordId: String(profile.id),
        profile: profile as DiscordProfileSlice,
        userId: user.id,
        providerAccountId: account.providerAccountId,
        fallbackName: user.name,
        fallbackImage: user.image,
      });
    },
  },
});
