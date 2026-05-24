import { getImageStorage } from "@/lib/storage";

export async function saveEventImage(eventId: string, file: File) {
  return getImageStorage().saveEventImage(eventId, file);
}

export async function readEventImage(
  eventId: string,
  storageKey: string,
): Promise<Buffer> {
  return getImageStorage().readEventImage(eventId, storageKey);
}
