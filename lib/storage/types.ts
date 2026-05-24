export type SavedImage = {
  storageKey: string;
  url: string;
  mimeType: string;
};

export type ImageStorageProvider = {
  saveEventImage(eventId: string, file: File): Promise<SavedImage>;
  readEventImage(eventId: string, storageKey: string): Promise<Buffer>;
  deleteEventImage?(eventId: string, storageKey: string): Promise<void>;
};
