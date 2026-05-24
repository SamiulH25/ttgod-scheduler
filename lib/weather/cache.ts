const DEFAULT_TTL_MS = Number(process.env.WEATHER_CACHE_TTL_SECONDS ?? 3600) * 1000;

type CacheEntry<T> = { value: T; expiresAt: number };

const weekCache = new Map<string, CacheEntry<unknown>>();

export function cacheKey(parts: string[]): string {
  return parts.join("|");
}

export function getCached<T>(key: string): T | null {
  const entry = weekCache.get(key) as CacheEntry<T> | undefined;
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    weekCache.delete(key);
    return null;
  }
  return entry.value;
}

export function setCached<T>(key: string, value: T, ttlMs = DEFAULT_TTL_MS): void {
  weekCache.set(key, { value, expiresAt: Date.now() + ttlMs });
}
