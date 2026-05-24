import path from "path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    exclude: ["**/node_modules/**", "**/dist/**", "e2e/**"],
    env: {
      DATABASE_URL:
        process.env.DATABASE_URL ??
        "postgresql://localhost:5432/ttgod_test?schema=public",
      AUTH_SECRET: process.env.AUTH_SECRET ?? "test-auth-secret-16chars",
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "."),
    },
  },
});
