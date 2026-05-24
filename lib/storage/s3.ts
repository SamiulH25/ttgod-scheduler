import {
  DeleteObjectCommand,
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { getEnv } from "@/lib/env";
import type { ImageStorageProvider, SavedImage } from "@/lib/storage/types";
import { assertImageFile } from "@/lib/storage/validate-image";

function objectKey(eventId: string, storageKey: string): string {
  return `events/${eventId}/${storageKey}`;
}

function publicUrl(eventId: string, storageKey: string): string {
  const env = getEnv();
  const prefix = env.S3_PUBLIC_URL_PREFIX?.replace(/\/$/, "");
  if (prefix) return `${prefix}/events/${eventId}/${storageKey}`;
  return `/api/events/${eventId}/images/${storageKey}`;
}

function createClient(): S3Client {
  const env = getEnv();
  return new S3Client({
    region: env.S3_REGION ?? "auto",
    endpoint: env.S3_ENDPOINT,
    credentials: {
      accessKeyId: env.S3_ACCESS_KEY_ID!,
      secretAccessKey: env.S3_SECRET_ACCESS_KEY!,
    },
    forcePathStyle: Boolean(env.S3_ENDPOINT),
  });
}

export const s3ImageStorage: ImageStorageProvider = {
  async saveEventImage(eventId: string, file: File): Promise<SavedImage> {
    await assertImageFile(file);
    const env = getEnv();
    const ext =
      file.type === "image/png"
        ? "png"
        : file.type === "image/webp"
          ? "webp"
          : file.type === "image/gif"
            ? "gif"
            : "jpg";
    const storageKey = `${crypto.randomUUID()}.${ext}`;
    const buffer = Buffer.from(await file.arrayBuffer());
    const client = createClient();
    await client.send(
      new PutObjectCommand({
        Bucket: env.S3_BUCKET!,
        Key: objectKey(eventId, storageKey),
        Body: buffer,
        ContentType: file.type,
      }),
    );
    return {
      storageKey,
      url: publicUrl(eventId, storageKey),
      mimeType: file.type,
    };
  },

  async readEventImage(eventId: string, storageKey: string): Promise<Buffer> {
    const env = getEnv();
    const client = createClient();
    const res = await client.send(
      new GetObjectCommand({
        Bucket: env.S3_BUCKET!,
        Key: objectKey(eventId, storageKey),
      }),
    );
    const bytes = await res.Body?.transformToByteArray();
    if (!bytes) throw new Error("Empty object");
    return Buffer.from(bytes);
  },

  async deleteEventImage(eventId: string, storageKey: string): Promise<void> {
    const env = getEnv();
    const client = createClient();
    await client.send(
      new DeleteObjectCommand({
        Bucket: env.S3_BUCKET!,
        Key: objectKey(eventId, storageKey),
      }),
    );
  },
};
