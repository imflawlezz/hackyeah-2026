type Bucket = { count: number; expires: number };

// Per-instance only in serverless; production should use a shared store.
export function createRateLimiter({
  limit,
  windowMs,
}: {
  limit: number;
  windowMs: number;
}): (key: string, now?: number) => boolean {
  const entries = new Map<string, Bucket>();
  return (key, now = Date.now()) => {
    for (const [id, entry] of entries) {
      if (entry.expires <= now) entries.delete(id);
    }
    const entry = entries.get(key);
    if (!entry) {
      if (entries.size >= 10_000) return false;
      entries.set(key, { count: 1, expires: now + windowMs });
      return true;
    }
    if (entry.count >= limit) return false;
    entry.count += 1;
    return true;
  };
}

export function clientIp(request: Request): string {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown"
  );
}
