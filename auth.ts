import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Discord from "next-auth/providers/discord";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { authConfig } from "@/auth.config";
import { prisma } from "@/lib/db";

const devAuthEnabled =
  process.env.NODE_ENV === "development" || process.env.DEV_AUTH_ENABLED === "true";

const discordConfigured =
  Boolean(process.env.AUTH_DISCORD_ID) && Boolean(process.env.AUTH_DISCORD_SECRET);

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
  }

  return token;
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  secret: process.env.AUTH_SECRET,
  trustHost: true,
  adapter: PrismaAdapter(prisma),
  providers: [
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

              return user;
            },
          }),
        ]
      : []),
    ...(discordConfigured
      ? [
          Discord({
            clientId: process.env.AUTH_DISCORD_ID!,
            clientSecret: process.env.AUTH_DISCORD_SECRET!,
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

      if (account?.provider === "discord" && profile?.id && token.sub) {
        const discordId = profile.id as string;
        await prisma.user.update({
          where: { id: token.sub },
          data: {
            discordId,
            name:
              user?.name ??
              (profile as { username?: string }).username ??
              undefined,
            image: user?.image ?? undefined,
          },
        });
        token.discordId = discordId;
      }

      if (user?.id || trigger === "update") {
        await loadUserIntoToken(token);
      }

      return token;
    },
  },
});
