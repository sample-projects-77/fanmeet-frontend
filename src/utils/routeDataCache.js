/**
 * In-memory cache for route/screen data so tab switches feel instant (like Flutter).
 * Show last-known data immediately, then refresh in background.
 *
 * Usage: getCached(key) before fetch; setCached(key, data) when fetch succeeds.
 * Optional TTL (ms) - after that, getCached returns null so we refetch.
 */

const cache = new Map();
const timestamps = new Map();

const DEFAULT_TTL_MS = 2 * 60 * 1000; // 2 minutes

export function getCached(key, ttlMs = DEFAULT_TTL_MS) {
  const entry = cache.get(key);
  if (entry == null) return null;
  const ts = timestamps.get(key);
  if (ttlMs > 0 && ts != null && Date.now() - ts > ttlMs) {
    cache.delete(key);
    timestamps.delete(key);
    return null;
  }
  return entry;
}

export function setCached(key, data, ttlMs = DEFAULT_TTL_MS) {
  cache.set(key, data);
  timestamps.set(key, Date.now());
}

export function clearCached(key) {
  cache.delete(key);
  timestamps.delete(key);
}

export function clearAllCached() {
  cache.clear();
  timestamps.clear();
}
