import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { logger } from "@/lib/logger";

export function jsonError(
  error: string,
  code: string,
  status: number,
): NextResponse {
  return NextResponse.json({ error, code }, { status });
}

export function handleApiError(err: unknown): NextResponse {
  if (err instanceof ZodError) {
    return NextResponse.json(
      {
        error: "Validation failed",
        code: "VALIDATION_ERROR",
        details: err.flatten(),
      },
      { status: 400 },
    );
  }

  const errId = crypto.randomUUID();
  logger.error("API internal error", {
    errId,
    error: err instanceof Error ? err.message : String(err),
  });
  return NextResponse.json(
    { error: "Internal server error", code: "INTERNAL_ERROR", errId },
    { status: 500 },
  );
}
