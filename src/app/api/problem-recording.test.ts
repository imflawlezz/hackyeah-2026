import { beforeEach, describe, expect, it, vi } from "vitest";

// Only a problem submitted on /match is a need for the admin trends.
// Assistant questions and institution profiles must not be stored.
const mocks = vi.hoisted(() => ({ match: vi.fn() }));
vi.mock("@/lib/match/service", () => ({ matchProblem: mocks.match }));
vi.mock("@/lib/ai/models", () => ({
  REASON_MODEL: "test-model",
  hasOpenAI: false,
}));
vi.mock("@/lib/supabase/server", () => ({
  hasSupabase: false,
  createClient: vi.fn(),
}));

let ip = 0;
function post(path: string, body: unknown) {
  return new Request(`http://localhost${path}`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-forwarded-for": `198.51.100.${++ip}`,
    },
    body: JSON.stringify(body),
  });
}

beforeEach(() => {
  mocks.match.mockReset();
  mocks.match.mockResolvedValue({
    results: [],
    noGoodMatch: true,
    source: "mock",
  });
});

describe("which routes record a problem", () => {
  it("records problems submitted on /api/match", async () => {
    const { POST } = await import("./match/route");
    await POST(post("/api/match", { problem: "Samotni seniorzy na wsi" }));
    expect(mocks.match).toHaveBeenCalledTimes(1);
    expect(mocks.match.mock.calls[0][1]).toMatchObject({ record: true });
  });

  it("does not record assistant questions", async () => {
    const { POST } = await import("./assistant/route");
    const response = await POST(
      post("/api/assistant", {
        messages: [
          { role: "user", content: "Jak sprawdzić, czy to potrzebne?" },
        ],
      }),
    );
    await response.text();
    expect(mocks.match).toHaveBeenCalledTimes(1);
    expect(mocks.match.mock.calls[0][1]?.record).not.toBe(true);
  });
});
