import { afterEach, describe, expect, it, vi } from "vitest";
import {
  contentSecurityPolicy,
  securityHeaders,
  supabaseOrigins,
} from "@/lib/security/headers";

const SUPABASE_URL = "https://abcdefghijklmnop.supabase.co";

function directives(policy: string): Record<string, string[]> {
  return Object.fromEntries(
    policy.split("; ").map((directive) => {
      const [name, ...sources] = directive.split(" ");
      return [name, sources];
    }),
  );
}

afterEach(() => {
  vi.unstubAllEnvs();
  vi.resetModules();
});

describe("securityHeaders", () => {
  it("lists the headers sent on every route", () => {
    const headers = securityHeaders({ supabaseUrl: SUPABASE_URL });
    expect(headers.map(({ key }) => key)).toEqual([
      "X-Content-Type-Options",
      "Referrer-Policy",
      "X-Frame-Options",
      "Permissions-Policy",
      "Content-Security-Policy",
    ]);
    const byKey = Object.fromEntries(
      headers.map(({ key, value }) => [key, value]),
    );
    expect(byKey["X-Content-Type-Options"]).toBe("nosniff");
    expect(byKey["Referrer-Policy"]).toBe("strict-origin-when-cross-origin");
    expect(byKey["X-Frame-Options"]).toBe("DENY");
    expect(byKey["Permissions-Policy"]).toBe(
      "camera=(), geolocation=(), microphone=(self)",
    );
  });

  it("builds the production content security policy", () => {
    expect(contentSecurityPolicy({ supabaseUrl: SUPABASE_URL })).toBe(
      [
        "default-src 'self'",
        "script-src 'self' 'unsafe-inline'",
        "style-src 'self' 'unsafe-inline'",
        "img-src 'self' data: blob: https:",
        "font-src 'self'",
        `connect-src 'self' ${SUPABASE_URL} wss://abcdefghijklmnop.supabase.co`,
        "media-src 'self' blob:",
        "frame-src 'self' https://www.youtube-nocookie.com",
        "object-src 'none'",
        "frame-ancestors 'none'",
        "base-uri 'self'",
        "form-action 'self'",
      ].join("; "),
    );
  });

  it("allows only same-origin connections without a usable Supabase URL", () => {
    for (const supabaseUrl of [undefined, "", "not a url", "ftp://x.test"]) {
      expect(
        directives(contentSecurityPolicy({ supabaseUrl }))["connect-src"],
      ).toEqual(["'self'"]);
    }
    expect(supabaseOrigins("http://127.0.0.1:54321/rest/v1")).toEqual([
      "http://127.0.0.1:54321",
      "ws://127.0.0.1:54321",
    ]);
  });

  it("relaxes the policy only for next dev and Vercel previews", () => {
    const production = directives(contentSecurityPolicy());
    expect(production["script-src"]).not.toContain("'unsafe-eval'");
    expect(JSON.stringify(production)).not.toContain("vercel");

    const development = directives(
      contentSecurityPolicy({ development: true }),
    );
    expect(development["script-src"]).toContain("'unsafe-eval'");
    expect(development["connect-src"]).toContain("ws:");

    const preview = directives(contentSecurityPolicy({ vercelPreview: true }));
    expect(preview["script-src"]).toContain("https://vercel.live");
    expect(preview["frame-src"]).toContain("https://vercel.live");
    expect(preview["script-src"]).not.toContain("'unsafe-eval'");
  });
});

describe("next.config.ts", () => {
  it("hides x-powered-by and sends the security headers on all routes", async () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", SUPABASE_URL);
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("VERCEL_ENV", "production");
    const { default: config } = await import("../../../next.config");

    expect(config.poweredByHeader).toBe(false);
    const rules = await config.headers!();
    expect(rules).toEqual([
      {
        source: "/:path*",
        headers: securityHeaders({ supabaseUrl: SUPABASE_URL }),
      },
    ]);
  });
});
