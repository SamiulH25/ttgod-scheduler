import { NextRequest, NextResponse } from "next/server";
import { requireSession } from "@/lib/auth";
import { handleApiError, jsonError } from "@/lib/api-response";
import { prisma } from "@/lib/db";
import { findSquadOverlaps } from "@/lib/overlaps";
import { toCalendarBlocks } from "@/lib/calendar";
import { POSTER, formatPosterTitle } from "@/lib/paper-poster";
import { freeUsersQuerySchema } from "@/lib/validations";

export const dynamic = "force-dynamic";

function escXml(s: string) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export async function GET(request: NextRequest) {
  try {
    const { user, error } = await requireSession();
    if (error) return error;

    const q = freeUsersQuerySchema.safeParse({
      start: request.nextUrl.searchParams.get("start") ?? undefined,
      end: request.nextUrl.searchParams.get("end") ?? undefined,
    });
    if (!q.success) {
      return jsonError("Invalid start/end", "BAD_REQUEST", 400);
    }
    const start = new Date(q.data.start);
    const end = new Date(q.data.end);

    const blocks = await prisma.availabilityBlock.findMany({
      where: { start: { lt: end }, end: { gt: start } },
      include: { user: { select: { id: true, name: true, image: true } } },
    });
    const overlaps = findSquadOverlaps(toCalendarBlocks(blocks), start, end);
    const best = overlaps[0];
    const count = best?.count ?? 0;
    const title = formatPosterTitle(count, start, end);

    const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${POSTER.width}" height="${POSTER.height}" viewBox="0 0 ${POSTER.width} ${POSTER.height}">
  <rect width="100%" height="100%" fill="${POSTER.bg}"/>
  <text x="60" y="120" font-family="${POSTER.fontDisplay}" font-size="52" fill="${POSTER.ink}">${escXml(title)}</text>
  <text x="60" y="200" font-family="${POSTER.fontSans}" font-size="28" fill="${POSTER.accent}">${escXml(start.toISOString().slice(0, 16))} → ${escXml(end.toISOString().slice(0, 16))}</text>
  <text x="60" y="520" font-family="${POSTER.fontSans}" font-size="22" fill="${POSTER.ink}">Shared by ${escXml(user!.name ?? "Squad")} · TTGOD</text>
  <rect x="60" y="260" width="1080" height="180" rx="12" fill="${POSTER.overlap}" opacity="0.35"/>
  <text x="80" y="330" font-family="${POSTER.fontSans}" font-size="36" fill="${POSTER.ink}">${count} overlapping</text>
</svg>`;

    return new NextResponse(svg, {
      headers: {
        "Content-Type": "image/svg+xml; charset=utf-8",
        "Cache-Control": "private, no-store",
      },
    });
  } catch (err) {
    return handleApiError(err);
  }
}
