import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { innovations } from "@/lib/mocks/innovations";

const mocks = vi.hoisted(() => ({
  embed: vi.fn(),
  reasons: vi.fn(),
  rpc: vi.fn(),
  client: vi.fn(),
  adminClient: vi.fn(),
  insert: vi.fn(),
}));
vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: mocks.adminClient,
}));
vi.mock("@/lib/ai/models", () => ({ hasOpenAI: true }));
vi.mock("@/lib/ai/embeddings", () => ({ embedText: mocks.embed }));
vi.mock("@/lib/ai/reasons", () => ({ generateReasons: mocks.reasons }));
vi.mock("@/lib/supabase/server", () => ({
  hasSupabase: true,
  createClient: mocks.client,
}));
import {
  classifyResults,
  matchProblem,
  normalizeMockScores,
  normalizeScore,
} from "./service";

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
  mocks.adminClient.mockReturnValue(null);
  mocks.insert.mockReturnValue({
    abortSignal: () => Promise.resolve({ error: null }),
  });
});

function withAdminClient() {
  mocks.adminClient.mockReturnValue({
    from: (table: string) => {
      expect(table).toBe("problems");
      return { insert: mocks.insert };
    },
  });
}
afterEach(() => {
  vi.restoreAllMocks();
  vi.useRealTimers();
});

describe("score normalization", () => {
  it("scales mock points absolutely, never to 100%, and handles empty or zero scores", () => {
    const results = [4, 3, 1, 4, 500].map((score) => ({
      score,
      innovation: innovations[0],
      reason: "Powód",
    }));
    expect(normalizeMockScores(results).map(({ score }) => score)).toEqual([
      0.5, 0.43, 0.2, 0.5, 0.95,
    ]);
    expect(
      normalizeMockScores(results).filter(({ score }) => score === 1),
    ).toHaveLength(0);
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

describe("classification", () => {
  const scored = (...scores: number[]) =>
    scores.map((score, index) => ({
      score,
      innovation: { ...innovations[0], id: `i${index}` },
      reason: "",
    }));

  it("tiers results at the boundaries and hides the rest", () => {
    const { results, noGoodMatch } = classifyResults(
      scored(0.62, 0.5, 0.49, 0.4, 0.39),
      true,
    );
    expect(results.map(({ score, tier }) => [score, tier])).toEqual([
      [0.62, "match"],
      [0.5, "match"],
      [0.49, "related"],
      [0.4, "related"],
    ]);
    expect(noGoodMatch).toBe(false);
  });

  it("reports no good match when nothing reaches the match tier", () => {
    expect(classifyResults(scored(0.49, 0.41), true)).toMatchObject({
      noGoodMatch: true,
      results: [{ tier: "related" }, { tier: "related" }],
    });
    expect(classifyResults(scored(0.39, 0.1), true)).toEqual({
      results: [],
      noGoodMatch: true,
    });
    expect(classifyResults([], true)).toEqual({
      results: [],
      noGoodMatch: true,
    });
  });

  it("keeps weak results as related for callers that do not hide them", () => {
    const { results, noGoodMatch } = classifyResults(scored(0.55, 0.2), false);
    expect(results.map(({ tier }) => tier)).toEqual(["match", "related"]);
    expect(noGoodMatch).toBe(false);
  });
});

describe("relevance threshold", () => {
  function rows(...similarities: number[]) {
    mocks.rpc.mockReturnValue({
      abortSignal: () =>
        Promise.resolve({
          data: similarities.map((similarity, index) => ({
            ...row(similarity),
            id: `r${index}`,
            title: `Rozwiązanie ${index}`,
            target_group: "Dorośli",
          })),
          error: null,
        }),
    });
  }

  it("returns matches first, then related results, and explains only matches", async () => {
    rows(0.61, 0.45, 0.3);
    const response = await matchProblem(
      { problem: "dziura w jezdni na drodze powiatowej", limit: 5 },
      { hideWeak: true },
    );
    expect(response.source).toBe("ai");
    expect(response.noGoodMatch).toBe(false);
    expect(response.results.map(({ score, tier }) => [score, tier])).toEqual([
      [0.61, "match"],
      [0.45, "related"],
    ]);
    expect(mocks.reasons.mock.calls[0][1]).toHaveLength(1);
    expect(response.results[0].reason).not.toBe("");
    expect(response.results[1].reason).toBe("");
  });

  it("reports no good match for weak results without calling the model", async () => {
    withAdminClient();
    rows(0.46, 0.31);
    const response = await matchProblem(
      { problem: "dziura w jezdni na drodze powiatowej" },
      { hideWeak: true, record: true },
    );
    expect(response).toMatchObject({
      source: "ai",
      noGoodMatch: true,
      results: [{ score: 0.46, tier: "related", reason: "" }],
    });
    expect(mocks.reasons).not.toHaveBeenCalled();
    // Stored as unmet for the admin trends, with the raw top similarity.
    expect(mocks.insert).toHaveBeenCalledWith(
      expect.objectContaining({ status: "new", best_score: 0.46 }),
    );
  });

  it("does not fall back to keyword results when the category filter leaves nothing", async () => {
    withAdminClient();
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const response = await matchProblem(
      { problem: "samotni seniorzy na wsi", category: "Bezdomność" },
      { hideWeak: true, record: true },
    );
    expect(response).toEqual({ source: "ai", results: [], noGoodMatch: true });
    expect(warn).not.toHaveBeenCalledWith("Match fallback", expect.anything());
    expect(mocks.reasons).not.toHaveBeenCalled();
    expect(mocks.insert).toHaveBeenCalledWith(
      expect.objectContaining({
        status: "new",
        best_score: null,
        source: "ai",
      }),
    );
  });

  it("keeps every result for callers that do not hide weak ones", async () => {
    rows(0.3, 0.25);
    const response = await matchProblem({ problem: "dziura w jezdni" });
    expect(response.results.map(({ tier }) => tier)).toEqual([
      "related",
      "related",
    ]);
    expect(response.noGoodMatch).toBe(true);
    expect(mocks.reasons.mock.calls[0][1]).toHaveLength(2);
  });
});

describe("AI matching", () => {
  it("maps RPC rows and generates reasons in one call", async () => {
    const response = await matchProblem({
      problem: "samotni seniorzy na wsi",
      limit: 5,
    });
    expect(response.source).toBe("ai");
    // 0.876 similarity + 0.015 for the shared word "seniorzy".
    expect(response.results[0].score).toBe(0.89);
    expect(response.results[0].innovation.targetGroup).toBe("Seniorzy na wsi");
    expect(response.results[0].reason).toContain("samotność");
    expect(mocks.rpc).toHaveBeenCalledWith("match_innovations", {
      query_embedding: [0.1],
      match_count: 15,
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
    // Each keeps its similarity plus 0.015 for the shared word "seniorzy".
    expect(response.results.map(({ score }) => score)).toEqual([0.92, 0.62]);
    expect(mocks.rpc.mock.calls[0][1].match_count).toBe(15);
  });
  it("promotes a close runner-up whose category matches the problem's theme", async () => {
    mocks.rpc.mockReturnValue({
      abortSignal: () =>
        Promise.resolve({
          data: [
            {
              ...row(0.467),
              id: "lunch",
              title: "Obiad przy wspólnym stole",
              category: "Samotność",
              target_group: "Seniorzy mieszkający samotnie",
              tags: ["seniorzy", "samotność", "wieś", "transport"],
            },
            {
              ...row(0.454),
              id: "barriers",
              title: "Mapa barier w gminie",
              category: "Dostępność",
              target_group: "Osoby z niepełnosprawnościami",
              tags: ["dostępność", "niepełnosprawność", "mapa"],
            },
            {
              ...row(0.431),
              id: "mobile",
              title: "Mobilny punkt dostępności",
              category: "Dostępność",
              target_group: "Osoby z niepełnosprawnościami",
              tags: ["niepełnosprawność", "dostępność", "urząd", "sprzęt"],
            },
          ],
          error: null,
        }),
    });
    mocks.reasons.mockResolvedValue({});
    const response = await matchProblem({
      problem:
        "Osoby na wózkach nie mogą dostać się do urzędu i ośrodka kultury.",
      limit: 3,
    });
    const ids = response.results.map(({ innovation }) => innovation.id);
    expect(new Set(ids.slice(0, 2))).toEqual(new Set(["mobile", "barriers"]));
    expect(ids[2]).toBe("lunch");
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
      "Kategoria: Seniorzy. Dla kogo: Seniorzy na wsi.",
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

describe("problem persistence", () => {
  it("stores AI matches with the top raw similarity, scrubbed text and embedding", async () => {
    withAdminClient();
    await matchProblem(
      {
        problem: "samotni seniorzy, kontakt: jan@hubmi.example",
        category: "Seniorzy",
      },
      { record: true },
    );
    expect(mocks.insert).toHaveBeenCalledTimes(1);
    expect(mocks.insert).toHaveBeenCalledWith({
      description: "samotni seniorzy, kontakt: [e-mail]",
      category: "Seniorzy",
      embedding: [0.1],
      status: "matched",
      best_score: 0.876,
      source: "ai",
    });
  });
  it("stores mock fallbacks without a score and marks empty results as new", async () => {
    withAdminClient();
    mocks.rpc.mockReturnValue({
      abortSignal: () => Promise.resolve({ data: [], error: null }),
    });
    await matchProblem({ problem: "xyzqwerty" }, { record: true });
    expect(mocks.insert).toHaveBeenCalledWith(
      expect.objectContaining({
        status: "new",
        best_score: null,
        source: "mock",
        embedding: [0.1],
        category: null,
      }),
    );
  });
  it("does not store anything unless the caller asks for it", async () => {
    withAdminClient();
    await matchProblem({ problem: "samotni seniorzy na wsi" });
    mocks.rpc.mockReturnValue({
      abortSignal: () => Promise.resolve({ data: [], error: null }),
    });
    await matchProblem({ problem: "xyzqwerty" });
    expect(mocks.insert).not.toHaveBeenCalled();
  });
  it("skips the insert when the admin client is not configured", async () => {
    await matchProblem({ problem: "samotni seniorzy" }, { record: true });
    expect(mocks.adminClient).toHaveBeenCalled();
    expect(mocks.insert).not.toHaveBeenCalled();
  });
  it("never fails or blocks the match when the insert fails or hangs", async () => {
    withAdminClient();
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    mocks.insert.mockReturnValue({
      abortSignal: () => Promise.resolve({ error: { message: "denied" } }),
    });
    expect(
      (await matchProblem({ problem: "seniorzy" }, { record: true })).source,
    ).toBe("ai");
    expect(warn).toHaveBeenCalledWith("Problem persistence failed", {
      problemLength: 8,
    });

    mocks.insert.mockReturnValue({ abortSignal: () => new Promise(() => {}) });
    const started = Date.now();
    expect(
      (await matchProblem({ problem: "seniorzy" }, { record: true })).source,
    ).toBe("ai");
    expect(Date.now() - started).toBeLessThan(1500);
  });
});
