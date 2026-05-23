import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { ALLOWED_IMAGE_MIMES, MAX_UPLOAD_BYTES } from "@/lib/validations";

const UPLOAD_ROOT = path.join(process.cwd(), "data", "uploads", "events");

export function eventUploadDir(eventId: string): string {
  return path.join(UPLOAD_ROOT, eventId);
}

export function imagePublicPath(eventId: string, filename: string): string {
  return `/api/events/${eventId}/images/${filename}`;
}

export async function saveEventImage(
  eventId: string,
  file: File,
): Promise<{ storageKey: string; url: string; mimeType: string }> {
  if (!ALLOWED_IMAGE_MIMES.includes(file.type as (typeof ALLOWED_IMAGE_MIMES)[number])) {
    throw new Error("Unsupported image type");
  }
  if (file.size > MAX_UPLOAD_BYTES) {
    throw new Error("Image too large");
  }

  const ext =
    file.type === "image/png"
      ? "png"
      : file.type === "image/webp"
        ? "webp"
        : file.type === "image/gif"
          ? "gif"
          : "jpg";

  const storageKey = `${crypto.randomUUID()}.${ext}`;
  const dir = eventUploadDir(eventId);
  await mkdir(dir, { recursive: true });

  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(path.join(dir, storageKey), buffer);

  return {
    storageKey,
    url: imagePublicPath(eventId, storageKey),
    mimeType: file.type,
  };
}

export function imageFilePath(eventId: string, storageKey: string): string {
  const safe = path.basename(storageKey);
  return path.join(eventUploadDir(eventId), safe);
}
