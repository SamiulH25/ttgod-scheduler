import { z } from "zod";

const baseSchema = z.object({
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
  AUTH_SECRET: z.string().optional(),
  AUTH_URL: z
    .string()
    .optional()
    .refine((v) => !v || v === "" || z.string().url().safeParse(v).success, {
      message: "AUTH_URL must be a valid URL",
    }),
  AUTH_DISCORD_ID: z.string().optional(),
  AUTH_DISCORD_SECRET: z.string().optional(),
  BOT_API_SECRET: z.string().optional(),
  NEXT_PUBLIC_APP_NAME: z.string().default("TTGOD Scheduler"),
  UPLOAD_STORAGE: z.enum(["local", "s3"]).default("local"),
  UPLOAD_MAX_BYTES: z.coerce.number().int().positive().optional(),
  SENTRY_DSN: z.string().optional(),
  S3_ENDPOINT: z.string().optional(),
  S3_BUCKET: z.string().optional(),
  S3_ACCESS_KEY_ID: z.string().optional(),
  S3_SECRET_ACCESS_KEY: z.string().optional(),
  S3_PUBLIC_URL_PREFIX: z.string().optional(),
  S3_REGION: z.string().optional(),
});

export type AppEnv = z.infer<typeof baseSchema>;

let cached: AppEnv | null = null;

function parseEnv(): AppEnv {
  const parsed = baseSchema.safeParse(process.env);
  if (!parsed.success) {
    const msg = parsed.error.issues
      .map((i) => `${i.path.join(".")}: ${i.message}`)
      .join("; ");
    throw new Error(`Invalid environment: ${msg}`);
  }
  return parsed.data;
}

/** Validates required secrets in production. Call at startup. */
export function validateProductionEnv(): void {
  const env = getEnv();
  if (env.NODE_ENV !== "production") return;

  const missing: string[] = [];
  if (!env.AUTH_SECRET || env.AUTH_SECRET.length < 16) {
    missing.push("AUTH_SECRET (min 16 chars)");
  }
  if (!env.AUTH_URL) missing.push("AUTH_URL");
  if (!env.AUTH_DISCORD_ID) missing.push("AUTH_DISCORD_ID");
  if (!env.AUTH_DISCORD_SECRET) missing.push("AUTH_DISCORD_SECRET");
  if (!env.BOT_API_SECRET || env.BOT_API_SECRET.length < 16) {
    missing.push("BOT_API_SECRET (min 16 chars)");
  }
  if (!env.DATABASE_URL.startsWith("postgresql")) {
    missing.push("DATABASE_URL must be a PostgreSQL connection string");
  }
  if (env.UPLOAD_STORAGE === "s3") {
    if (!env.S3_BUCKET) missing.push("S3_BUCKET");
    if (!env.S3_ACCESS_KEY_ID) missing.push("S3_ACCESS_KEY_ID");
    if (!env.S3_SECRET_ACCESS_KEY) missing.push("S3_SECRET_ACCESS_KEY");
  }

  if (missing.length > 0) {
    throw new Error(
      `Production environment incomplete: ${missing.join(", ")}`,
    );
  }
}

export function getEnv(): AppEnv {
  if (!cached) cached = parseEnv();
  return cached;
}

export function isProduction(): boolean {
  return getEnv().NODE_ENV === "production";
}
