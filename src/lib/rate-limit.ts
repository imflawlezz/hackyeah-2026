const MAX_KEYS = 10_000;

/**
 * Fixed-window, in-memory limiter. Per server instance only; production should
 * use a shared store. Returns true when the call identified by `key` is allowed.
 */
export function createRateLimiter({
  limit,
  windowMs,
}: {
  limit: number;
  windowMs: number;
}): (key: string, now?: number) => boolean {
  const entries = new Map<string, { count: number; expires: number }>();
  return (key, now = Date.now()) => {
    for (const [entryKey, entry] of entries) {
      if (entry.expires <= now) entries.delete(entryKey);
    }
    const entry = entries.get(key);
    if (!entry) {
      if (entries.size >= MAX_KEYS) return false;
      entries.set(key, { count: 1, expires: now + windowMs });
      return limit > 0;
    }
    if (entry.count >= limit) return false;
    entry.count++;
    return true;
  };
}
