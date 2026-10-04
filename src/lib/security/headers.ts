export type SecurityHeader = { key: string; value: string };

export type SecurityHeaderOptions = {
  /** `NEXT_PUBLIC_SUPABASE_URL`; without it only same-origin connections are allowed. */
  supabaseUrl?: string;
  /** `next dev` needs eval for React Refresh and a websocket for hot reload. */
  development?: boolean;
  /** Vercel preview deployments load the comments toolbar from vercel.live. */
  vercelPreview?: boolean;
};

/** The only third-party frame: privacy-enhanced YouTube embeds on /knowledge/[id]. */
const VIDEO_EMBED_ORIGIN = "https://www.youtube-nocookie.com";

/** `https://<ref>.supabase.co` and its websocket twin, or nothing for a missing or invalid URL. */
export function supabaseOrigins(supabaseUrl?: string): string[] {
  if (!supabaseUrl) return [];
  try {
    const { protocol, host } = new URL(supabaseUrl);
    if (protocol !== "https:" && protocol !== "http:") return [];
    return [
      `${protocol}//${host}`,
      `${protocol === "https:" ? "wss:" : "ws:"}//${host}`,
    ];
  } catch {
    return [];
  }
}

export function contentSecurityPolicy({
  supabaseUrl,
  development = false,
  vercelPreview = false,
}: SecurityHeaderOptions = {}): string {
  const preview = (...sources: string[]) => (vercelPreview ? sources : []);
  const directives: Record<string, string[]> = {
    "default-src": ["'self'"],
    // Inline scripts: the font-size and theme init scripts and Next.js
    // bootstrap data. A nonce-based policy is the documented follow-up.
    "script-src": [
      "'self'",
      "'unsafe-inline'",
      ...(development ? ["'unsafe-eval'"] : []),
      ...preview("https://vercel.live"),
    ],
    "style-src": [
      "'self'",
      "'unsafe-inline'",
      ...preview("https://vercel.live"),
    ],
    "img-src": ["'self'", "data:", "blob:", "https:"],
    "font-src": [
      "'self'",
      ...preview("https://vercel.live", "https://assets.vercel.com"),
    ],
    "connect-src": [
      "'self'",
      ...supabaseOrigins(supabaseUrl),
      ...(development ? ["ws:"] : []),
      ...preview("https://vercel.live", "wss://ws-us3.pusher.com"),
    ],
    "media-src": ["'self'", "blob:"],
    "frame-src": [
      "'self'",
      VIDEO_EMBED_ORIGIN,
      ...preview("https://vercel.live"),
    ],
    "object-src": ["'none'"],
    "frame-ancestors": ["'none'"],
    "base-uri": ["'self'"],
    "form-action": ["'self'"],
  };
  return Object.entries(directives)
    .map(([name, sources]) => `${name} ${sources.join(" ")}`)
    .join("; ");
}

/** Response headers for every route; used by next.config.ts. */
export function securityHeaders(
  options: SecurityHeaderOptions = {},
): SecurityHeader[] {
  return [
    { key: "X-Content-Type-Options", value: "nosniff" },
    { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
    { key: "X-Frame-Options", value: "DENY" },
    {
      key: "Permissions-Policy",
      // Voice input records from the microphone on this origin only.
      value: "camera=(), geolocation=(), microphone=(self)",
    },
    { key: "Content-Security-Policy", value: contentSecurityPolicy(options) },
  ];
}
