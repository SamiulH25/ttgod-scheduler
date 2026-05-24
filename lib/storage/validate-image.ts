import { ALLOWED_IMAGE_MIMES, MAX_UPLOAD_BYTES } from "@/lib/validations";
import { getEnv } from "@/lib/env";

const MAGIC: Record<string, number[][]> = {
  "image/jpeg": [[0xff, 0xd8, 0xff]],
  "image/png": [[0x89, 0x50, 0x4e, 0x47]],
  "image/gif": [
    [0x47, 0x49, 0x46, 0x38, 0x37, 0x61],
    [0x47, 0x49, 0x46, 0x38, 0x39, 0x61],
  ],
  "image/webp": [[0x52, 0x49, 0x46, 0x46]], // RIFF header; WEBP at offset 8
};

function matchesMagic(bytes: Uint8Array, mime: string): boolean {
  const patterns = MAGIC[mime];
  if (!patterns) return false;
  if (mime === "image/webp") {
    return (
      bytes.length >= 12 &&
      patterns[0].every((b, i) => bytes[i] === b) &&
      bytes[8] === 0x57 &&
      bytes[9] === 0x45 &&
      bytes[10] === 0x42 &&
      bytes[11] === 0x50
    );
  }
  return patterns.some((pattern) =>
    pattern.every((byte, i) => bytes[i] === byte),
  );
}

export async function assertImageFile(file: File): Promise<void> {
  if (!ALLOWED_IMAGE_MIMES.includes(file.type as (typeof ALLOWED_IMAGE_MIMES)[number])) {
    throw new Error("Unsupported image type");
  }
  const maxBytes = getEnv().UPLOAD_MAX_BYTES ?? MAX_UPLOAD_BYTES;
  if (file.size > maxBytes) {
    throw new Error("Image too large");
  }
  const head = new Uint8Array(await file.slice(0, 16).arrayBuffer());
  if (!matchesMagic(head, file.type)) {
    throw new Error("File content does not match declared image type");
  }
}
