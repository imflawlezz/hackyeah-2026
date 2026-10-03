import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { innovations } from "@/lib/mocks/innovations";

const mocks = vi.hoisted(() => ({
  embed: vi.fn(),
  reasons: vi.fn(),
  rpc: vi.fn(),
  client: vi.fn(),
}));
vi.mock("@/lib/ai/models", () => ({ hasOpenAI: true }));
vi.mock("@/lib/ai/embeddings", () => ({ embedText: mocks.embed }));
vi.mock("@/lib/ai/reasons", () => ({ generateReasons: mocks.reasons }));
vi.mock("@/lib/supabase/server", () => ({
  hasSupabase: true,
  createClient: mocks.client,
}));
import { matchProblem, normalizeMockScores, normalizeScore } from "./service";

function row(similarity = 0.876) {
  return {
    id: "test",
    title: "Klub seniora",
    description: "Wspólne spotkania",
    category: "Seniorzy",
    target_group: "Seniorzy na wsi",
    tags: [],
    similarity,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  mocks.embed.mockResolvedValue([0.1]);
  mocks.reasons.mockResolvedValue({
    test: "Wspólne spotkania mogą pomóc ograniczyć samotność.",
  });
  mocks.rpc.mockReturnValue({
    abortSignal: () => Promise.resolve({ data: [row()], error: null }),
  });
  mocks.client.mockResolvedValue({ rpc: mocks.rpc });
});
afterEach(() => {
  vi.restoreAllMocks();
  vi.useRealTimers();
});

describe("score normalization", () => {
  it("normalizes mocks relative to their highest score and handles empty or zero scores", () => {
    const results = [4, 3, 1].map((score) => ({
      score,
      innovation: innovations[0],
      reason: "Powód",
    }));
    expect(normalizeMockScores(results).map(({ score }) => score)).toEqual([
      1, 0.75, 0.25,
    ]);
    expect(results[0].score).toBe(4);
    expect(normalizeMockScores([])).toEqual([]);
    expect(normalizeMockScores([{ ...results[0], score: 0 }])[0].score).toBe(0);
  });
  it("clamps, rounds and rejects non-finite similarity", () => {
    expect([-1, 0.876, 2, NaN, Infinity].map(normalizeScore)).toEqual([
      0, 0.88, 1, 0, 0,
    ]);
  });
});

describe("AI matching", () => {
  it("maps RPC rows and generates reasons in one call", async () => {
    const response = await matchProblem({
      problem: "samotni seniorzy na wsi",
      limit: 5,
    });
    expect(response.source).toBe("ai");
    expect(response.results[0].score).toBe(0.88);
    expect(response.results[0].innovation.targetGroup).toBe("Seniorzy na wsi");
    expect(response.results[0].reason).toContain("samotność");
    expect(mocks.rpc).toHaveBeenCalledWith("match_innovations", {
      query_embedding: [0.1],
      match_count: 5,
    });
    expect(mocks.reasons).toHaveBeenCalledTimes(1);
  });
  it("filters categories, oversamples and sorts by relevance", async () => {
    mocks.rpc.mockReturnValue({
      abortSignal: () =>
        Promise.resolve({
          data: [
            { ...row(0.6), id: "low" },
            { ...row(0.99), category: "Młodzież" },
            row(0.9),
          ],
          error: null,
        }),
    });
    const response = await matchProblem({
      problem: "samotni seniorzy",
      category: " seniorzy ",
      limit: 2,
    });
    expect(response.results.map(({ score }) => score)).toEqual([0.9, 0.6]);
    expect(mocks.rpc.mock.calls[0][1].match_count).toBe(6);
  });
  it.each([
    { data: [], error: null },
    { data: null, error: { message: "Missing RPC" } },
  ])("falls back on empty or failed RPC: %j", async (result) => {
    mocks.rpc.mockReturnValue({ abortSignal: () => Promise.resolve(result) });
    expect((await matchProblem({ problem: "seniorzy" })).source).toBe("mock");
  });
  it("retains AI matches and template reasons if generation fails", async () => {
    mocks.reasons.mockRejectedValue(new Error("Unavailable"));
    const response = await matchProblem({ problem: "seniorzy" });
    expect(response.source).toBe("ai");
    expect(response.results[0].reason).toBe(
      "Rozwiązanie z kategorii „Seniorzy” skierowane do: Seniorzy na wsi.",
    );
  });
  it("bounds a hung embedding with the overall deadline", async () => {
    vi.useFakeTimers();
    vi.spyOn(AbortSignal, "timeout").mockImplementation((delay) => {
      const controller = new AbortController();
      setTimeout(() => controller.abort(), delay);
      return controller.signal;
    });
    mocks.embed.mockReturnValue(new Promise(() => {}));
    const result = matchProblem({ problem: "seniorzy" });
    await vi.advanceTimersByTimeAsync(7500);
    expect((await result).source).toBe("mock");
  });
});
