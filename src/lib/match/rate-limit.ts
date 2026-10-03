const entries = new Map<string, { count: number; expires: number }>();
const WINDOW_MS = 60_000;

// Per-instance only in serverless; production should use Upstash or a similar shared store.
export function allowMatchRequest(ip: string, now = Date.now()): boolean {
  for (const [key, entry] of entries) {
    if (entry.expires <= now) entries.delete(key);
  }
  const entry = entries.get(ip);
  if (!entry) {
    // Bound memory even when clients supply many different forwarded addresses.
    if (entries.size >= 10_000) return false;
    entries.set(ip, { count: 1, expires: now + WINDOW_MS });
    return true;
  }
  if (entry.count >= 20) return false;
  entry.count++;
  return true;
}
