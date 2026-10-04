import { beforeEach, describe, expect, it, vi } from "vitest";
import { z } from "zod";
import { MATCH_THRESHOLD, RELATED_THRESHOLD } from "@/lib/match/score";
import { matchResultSchema } from "@/lib/validators";

const responseSchema = z.object({
  results: matchResultSchema
    .extend({ tier: z.enum(["match", "related"]) })
    .array(),
  noGoodMatch: z.boolean(),
});

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
    const { results, noGoodMatch } = responseSchema.parse(
      await response.json(),
    );
    expect(results.length).toBeGreaterThan(0);
    expect(results.length).toBeLessThanOrEqual(5);
    expect(results[0].score).toBeGreaterThan(0);
    expect(results.every(({ score }) => score >= 0 && score < 1)).toBe(true);
    expect(mocks.embed).not.toHaveBeenCalled();
    // The tier follows the score, and results below the related tier are gone.
    expect(noGoodMatch).toBe(false);
    expect(results[0].tier).toBe("match");
    for (const { score, tier } of results) {
      expect(score).toBeGreaterThanOrEqual(RELATED_THRESHOLD);
      expect(tier).toBe(score >= MATCH_THRESHOLD ? "match" : "related");
    }
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
    expect(
      responseSchema.parse(await response.json()).results.length,
    ).toBeLessThanOrEqual(10);
  });

  it("falls back when the mocked AI module throws", async () => {
    mocks.configured = true;
    mocks.embed.mockRejectedValue(new Error("Provider unavailable"));
    const response = await POST(
      request({ problem: "samotni seniorzy na wsi" }),
    );
    expect(response.status).toBe(200);
    expect(response.headers.get("X-Match-Source")).toBe("mock");
    const { results } = responseSchema.parse(await response.json());
    expect(results[0].score).toBeGreaterThan(0);
    expect(results[0].score).toBeLessThan(1);
  });

  it("reports no good match when nothing fits", async () => {
    const response = await POST(request({ problem: "xyzqwerty" }));
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ results: [], noGoodMatch: true });
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
