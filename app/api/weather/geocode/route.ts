import { NextRequest, NextResponse } from "next/server";
import { requireSession } from "@/lib/auth";
import { handleApiError } from "@/lib/api-response";
import { searchCities } from "@/lib/weather/geocode";
import { geocodeQuerySchema } from "@/lib/validations";

export async function GET(request: NextRequest) {
  try {
    const { error } = await requireSession();
    if (error) return error;

    const q = request.nextUrl.searchParams.get("q") ?? "";
    const { q: query } = geocodeQuerySchema.parse({ q });
    const results = await searchCities(query);
    return NextResponse.json({ results });
  } catch (err) {
    return handleApiError(err);
  }
}
