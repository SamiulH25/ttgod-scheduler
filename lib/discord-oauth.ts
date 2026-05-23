/** Read env var; treat blank strings as unset (empty `KEY=` in .env). */
function env(name: string): string | undefined {
  const value = process.env[name]?.trim();
  return value || undefined;
}

export type DiscordOAuthCredentials = {
  clientId: string;
  clientSecret: string;
};

/** Resolve Discord OAuth credentials from standard Auth.js or legacy env names. */
export function getDiscordOAuthCredentials(): DiscordOAuthCredentials | null {
  const clientId =
    env("AUTH_DISCORD_ID") ??
    env("DISCORD_CLIENT_ID") ??
    env("AUTH_DISCORD_CLIENT_ID");

  const clientSecret =
    env("AUTH_DISCORD_SECRET") ??
    env("DISCORD_CLIENT_SECRET") ??
    env("AUTH_DISCORD_CLIENT_SECRET");

  if (!clientId || !clientSecret) return null;
  return { clientId, clientSecret };
}

export function isDiscordOAuthConfigured(): boolean {
  return getDiscordOAuthCredentials() !== null;
}
