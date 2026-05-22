import { NextResponse } from "next/server";
import { ZodError } from "zod";

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

  console.error(err);
  return jsonError("Internal server error", "INTERNAL_ERROR", 500);
}
