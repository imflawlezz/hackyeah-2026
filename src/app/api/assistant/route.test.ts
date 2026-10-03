import { beforeEach, describe, expect, it, vi } from "vitest";
import { innovations } from "@/lib/mocks";

vi.mock("@/lib/ai/models", () => ({
  REASON_MODEL: "gpt-4o-mini",
  hasOpenAI: false,
}));
vi.mock("@/lib/supabase/server", () => ({
  hasSupabase: false,
  createClient: vi.fn(),
}));

let POST: typeof import("./route").POST;
let GET: typeof import("./route").GET;

function request(body: unknown, ip = "192.0.2.40", raw = false) {
  return new Request("http://localhost/api/assistant", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-forwarded-for": ip,
    },
    body: raw ? String(body) : JSON.stringify(body),
  });
}

beforeEach(async () => {
  vi.resetModules();
  const route = await import("./route");
  POST = route.POST;
  GET = route.GET;
});

describe("/api/assistant", () => {
  it("streams a fallback reply without a key", async () => {
    const response = await POST(
      request({
        messages: [
          {
            role: "user",
            content: "Samotni seniorzy na wsi potrzebują opieki w ciągu dnia.",
          },
        ],
      }),
    );
    expect(response.status).toBe(200);
    expect(response.headers.get("X-Assistant-Source")).toBe("fallback");
    const text = await response.text();
    expect(text).toContain("Jaki problem chcesz rozwiązać?");
    expect(
      innovations.some((innovation) => text.includes(innovation.title)),
    ).toBe(true);
  });

  it("rejects GET and invalid bodies", async () => {
    expect(GET().status).toBe(405);
    expect((await POST(request("{", "192.0.2.41", true))).status).toBe(400);
    expect(
      (
        await POST(
          request(
            {
              messages: Array.from({ length: 13 }, () => ({
                role: "user",
                content: "Pytanie o pomysł.",
              })),
            },
            "192.0.2.42",
          ),
        )
      ).status,
    ).toBe(400);
    expect(
      (
        await POST(
          request(
            { messages: [{ role: "user", content: "a".repeat(2001) }] },
            "192.0.2.43",
          ),
        )
      ).status,
    ).toBe(400);
  });

  it("returns 429 after fifteen questions from one address", async () => {
    const ip = "192.0.2.44";
    const body = {
      messages: [{ role: "user", content: "Jak sprawdzić, czy to potrzebne?" }],
    };
    for (let attempt = 0; attempt < 15; attempt += 1) {
      expect((await POST(request(body, ip))).status).toBe(200);
    }
    const blocked = await POST(request(body, ip));
    expect(blocked.status).toBe(429);
    expect(await blocked.json()).toEqual({
      error: "Za dużo zapytań. Spróbuj ponownie za minutę.",
    });
  });
});
