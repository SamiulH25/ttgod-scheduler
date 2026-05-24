import { getEnv } from "@/lib/env";
import { localImageStorage } from "@/lib/storage/local";
import { s3ImageStorage } from "@/lib/storage/s3";
import type { ImageStorageProvider } from "@/lib/storage/types";

let provider: ImageStorageProvider | null = null;

export function getImageStorage(): ImageStorageProvider {
  if (!provider) {
    provider =
      getEnv().UPLOAD_STORAGE === "s3" ? s3ImageStorage : localImageStorage;
  }
  return provider;
}

export { imagePublicPath } from "@/lib/storage/local";
