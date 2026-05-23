import type { NextAuthConfig } from "next-auth";

export const authConfig = {
  pages: {
    signIn: "/",
  },
  session: {
    strategy: "jwt",
  },
  providers: [],
  callbacks: {
    session({ session, token }) {
      if (token.sub && session.user) {
        session.user.id = token.sub;
        session.user.discordId = (token.discordId as string) ?? "";
        session.user.timezone = (token.timezone as string) ?? "UTC";
        session.user.theme = (token.theme as typeof session.user.theme) ?? "light";
        session.user.font = (token.font as typeof session.user.font) ?? "caveat";
        session.user.onboardingCompleted =
          (token.onboardingCompleted as boolean) ?? false;
      }
      return session;
    },
  },
} satisfies NextAuthConfig;
