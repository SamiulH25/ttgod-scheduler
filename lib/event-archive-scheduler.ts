import { autoArchiveCompletedEvents } from "@/lib/event-archive-db";

const INTERVAL_MS = 15 * 60 * 1000;
let lastRun = 0;
let inflight: Promise<void> | null = null;

/** Run auto-archive at most once per 15 minutes per server instance. */
export async function maybeAutoArchiveCompletedEvents(): Promise<void> {
  const now = Date.now();
  if (now - lastRun < INTERVAL_MS) return;
  if (inflight) return inflight;

  inflight = autoArchiveCompletedEvents()
    .then(() => {
      lastRun = Date.now();
    })
    .finally(() => {
      inflight = null;
    });

  return inflight;
}
