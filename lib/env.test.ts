import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

describe("validateProductionEnv", () => {
  const envBackup = { ...process.env };

  beforeEach(() => {
    vi.resetModules();
  });

  afterEach(() => {
    process.env = { ...envBackup };
  });

  it("requires Discord and secrets in production", async () => {
    process.env.NODE_ENV = "production";
    process.env.DATABASE_URL = "postgresql://u:p@localhost/db";
    process.env.AUTH_SECRET = "short";
    process.env.AUTH_URL = "https://example.com";
    process.env.AUTH_DISCORD_ID = "id";
    process.env.AUTH_DISCORD_SECRET = "secret";
    process.env.BOT_API_SECRET = "bot-secret-16chars!!";

    const { validateProductionEnv } = await import("@/lib/env");
    expect(() => validateProductionEnv()).toThrow(/AUTH_SECRET/);
  });

  it("passes with complete production env", async () => {
    process.env.NODE_ENV = "production";
    process.env.DATABASE_URL = "postgresql://u:p@localhost/db";
    process.env.AUTH_SECRET = "production-auth-secret-ok";
    process.env.AUTH_URL = "https://example.com";
    process.env.AUTH_DISCORD_ID = "id";
    process.env.AUTH_DISCORD_SECRET = "secret";
    process.env.BOT_API_SECRET = "bot-secret-16chars!!";

    const mod = await import("@/lib/env");
    expect(() => mod.validateProductionEnv()).not.toThrow();
  });
});
