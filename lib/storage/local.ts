import { mkdir, readFile, writeFile } from "fs/promises";
import path from "path";
import type { ImageStorageProvider, SavedImage } from "@/lib/storage/types";
import { assertImageFile } from "@/lib/storage/validate-image";

const UPLOAD_ROOT = path.join(process.cwd(), "data", "uploads", "events");

function eventDir(eventId: string): string {
  return path.join(UPLOAD_ROOT, eventId);
}

export function imagePublicPath(eventId: string, filename: string): string {
  return `/api/events/${eventId}/images/${filename}`;
}

export const localImageStorage: ImageStorageProvider = {
  async saveEventImage(eventId: string, file: File): Promise<SavedImage> {
    await assertImageFile(file);
    const ext =
      file.type === "image/png"
        ? "png"
        : file.type === "image/webp"
          ? "webp"
          : file.type === "image/gif"
            ? "gif"
            : "jpg";
    const storageKey = `${crypto.randomUUID()}.${ext}`;
    const dir = eventDir(eventId);
    await mkdir(dir, { recursive: true });
    const buffer = Buffer.from(await file.arrayBuffer());
    await writeFile(path.join(dir, storageKey), buffer);
    return {
      storageKey,
      url: imagePublicPath(eventId, storageKey),
      mimeType: file.type,
    };
  },

  async readEventImage(eventId: string, storageKey: string): Promise<Buffer> {
    const safe = path.basename(storageKey);
    return readFile(path.join(eventDir(eventId), safe));
  },
};
