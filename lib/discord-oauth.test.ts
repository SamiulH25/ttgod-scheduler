import { afterEach, describe, expect, it } from "vitest";
import {
  getDiscordOAuthCredentials,
  isDiscordOAuthConfigured,
} from "./discord-oauth";

describe("discord-oauth", () => {
  const keys = [
    "AUTH_DISCORD_ID",
    "AUTH_DISCORD_SECRET",
    "DISCORD_CLIENT_ID",
    "DISCORD_CLIENT_SECRET",
  ] as const;

  afterEach(() => {
    for (const key of keys) {
      delete process.env[key];
    }
  });

  it("returns null when credentials are missing or blank", () => {
    process.env.AUTH_DISCORD_ID = "";
    process.env.AUTH_DISCORD_SECRET = "secret";
    expect(getDiscordOAuthCredentials()).toBeNull();
    expect(isDiscordOAuthConfigured()).toBe(false);
  });

  it("reads AUTH_DISCORD_ID and AUTH_DISCORD_SECRET", () => {
    process.env.AUTH_DISCORD_ID = "123";
    process.env.AUTH_DISCORD_SECRET = "abc";
    expect(getDiscordOAuthCredentials()).toEqual({
      clientId: "123",
      clientSecret: "abc",
    });
  });

  it("falls back to DISCORD_CLIENT_ID naming", () => {
    process.env.DISCORD_CLIENT_ID = "456";
    process.env.DISCORD_CLIENT_SECRET = "def";
    expect(getDiscordOAuthCredentials()?.clientId).toBe("456");
  });
});
