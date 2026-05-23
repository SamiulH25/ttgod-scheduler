/** JSON-safe campaign detail payload (dates as ISO strings). */
export type SerializedEventDetail = {
  start: string | null;
  end: string | null;
  proposals: { start: string; end: string; [key: string]: unknown }[];
  images: { url: string; [key: string]: unknown }[];
  [key: string]: unknown;
};

type EventDetailSource = {
  start: Date | string | null;
  end: Date | string | null;
  proposals: { start: Date | string; end: Date | string; [key: string]: unknown }[];
  images: { url: string; [key: string]: unknown }[];
  [key: string]: unknown;
};

function toIso(value: Date | string): string {
  return value instanceof Date ? value.toISOString() : value;
}

export function serializeEventDetail<T extends EventDetailSource>(
  event: T,
): Omit<T, "start" | "end" | "proposals" | "images"> & SerializedEventDetail {
  return {
    ...event,
    start: event.start ? toIso(event.start) : null,
    end: event.end ? toIso(event.end) : null,
    proposals: event.proposals.map((p) => ({
      ...p,
      start: toIso(p.start),
      end: toIso(p.end),
    })),
    images: event.images.map((img) => ({
      ...img,
      url: img.url,
    })),
  } as Omit<T, "start" | "end" | "proposals" | "images"> & SerializedEventDetail;
}
