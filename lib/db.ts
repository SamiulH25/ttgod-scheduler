import { PrismaClient } from "@prisma/client";

function assertPostgresDatabaseUrl(): void {
  const url = process.env.DATABASE_URL ?? "";
  if (url.startsWith("file:")) {
    throw new Error(
      "DATABASE_URL still uses SQLite (file:...). This project requires PostgreSQL. " +
        "Update .env — see README § Database or docs/WINDOWS_DEV.md.",
    );
  }
  if (
    url.length > 0 &&
    !url.startsWith("postgresql://") &&
    !url.startsWith("postgres://")
  ) {
    throw new Error(
      "DATABASE_URL must start with postgresql:// or postgres://",
    );
  }
}

assertPostgresDatabaseUrl();

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
