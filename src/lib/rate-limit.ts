const MAX_KEYS = 10_000;

/**
 * Fixed-window limiter. Returns a function that answers "may this key make
 * another request now?" and counts the request when it may.
 *
 * Per-instance only in serverless; production should use Upstash or a similar
 * shared store.
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
      // Bound memory even when clients supply many different forwarded addresses.
      if (entries.size >= MAX_KEYS) return false;
      entries.set(key, { count: 1, expires: now + windowMs });
      return true;
    }
    if (entry.count >= limit) return false;
    entry.count++;
    return true;
  };
}

/** The first forwarded address, as the other API routes read it. */
export function clientKey(request: Request): string {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown"
  );
}
