import { beforeEach, describe, expect, it, vi } from "vitest";
import { matchResultSchema } from "@/lib/validators";

const mocks = vi.hoisted(() => ({ configured: false, embed: vi.fn() }));
vi.mock("@/lib/ai/models", () => ({
  get hasOpenAI() {
    return mocks.configured;
  },
}));
vi.mock("@/lib/ai/embeddings", () => ({ embedText: mocks.embed }));
vi.mock("@/lib/ai/reasons", () => ({ generateReasons: vi.fn() }));
vi.mock("@/lib/supabase/server", () => ({
  get hasSupabase() {
    return mocks.configured;
  },
  createClient: vi.fn(),
}));

let POST: typeof import("./route").POST;
function request(body: unknown, raw = false) {
  return new Request("http://localhost/api/match", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-forwarded-for": "192.0.2.1",
    },
    body: raw ? String(body) : JSON.stringify(body),
  });
}

beforeEach(async () => {
  vi.resetModules();
  mocks.configured = false;
  mocks.embed.mockReset();
  POST = (await import("./route")).POST;
});

describe("POST /api/match", () => {
  it("returns normalized contract-valid mock results without configuration", async () => {
    const response = await POST(
      request({ problem: "samotni seniorzy na wsi" }),
    );
    expect(response.status).toBe(200);
    expect(response.headers.get("X-Match-Source")).toBe("mock");
    const results = matchResultSchema.array().parse(await response.json());
    expect(results.length).toBeGreaterThan(0);
    expect(results.length).toBeLessThanOrEqual(5);
    expect(results[0].score).toBeGreaterThan(0);
    expect(results.every(({ score }) => score >= 0 && score < 1)).toBe(true);
    expect(mocks.embed).not.toHaveBeenCalled();
  });

  it.each([
    ["{", true],
    [{}, false],
    [{ problem: "a".repeat(2001) }, false],
    [{ problem: "   " }, false],
    [{ problem: "ab" }, false],
  ])("rejects invalid input %j", async (body, raw) => {
    expect((await POST(request(body, raw))).status).toBe(400);
  });

  it("trims the problem and clamps the requested limit", async () => {
    const response = await POST(
      request({ problem: "  seniorzy  ", limit: 100 }),
    );
    expect(response.status).toBe(200);
    expect((await response.json()).length).toBeLessThanOrEqual(10);
  });

  it("falls back when the mocked AI module throws", async () => {
    mocks.configured = true;
    mocks.embed.mockRejectedValue(new Error("Provider unavailable"));
    const response = await POST(
      request({ problem: "samotni seniorzy na wsi" }),
    );
    expect(response.status).toBe(200);
    expect(response.headers.get("X-Match-Source")).toBe("mock");
    const results = matchResultSchema.array().parse(await response.json());
    expect(results[0].score).toBeGreaterThan(0);
    expect(results[0].score).toBeLessThan(1);
  });

  it("returns an empty array when no mocks match", async () => {
    const response = await POST(request({ problem: "xyzqwerty" }));
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual([]);
  });

  it("limits each IP to 20 requests per minute", async () => {
    for (let index = 0; index < 20; index++) {
      expect((await POST(request({ problem: "seniorzy" }))).status).toBe(200);
    }
    const response = await POST(request({ problem: "seniorzy" }));
    expect(response.status).toBe(429);
    expect(await response.json()).toEqual({
      error: "Zbyt wiele zapytań. Spróbuj ponownie za minutę.",
    });
  });
});
