import type { MatchRequest, MatchResult } from "@/types";
import { type MatchTier, matchTier } from "@/lib/match/score";
import { mockMatch } from "@/lib/mocks";
import { embedText } from "@/lib/ai/embeddings";
import { generateReasons } from "@/lib/ai/reasons";
import { hasOpenAI } from "@/lib/ai/models";
import { createClient, hasSupabase } from "@/lib/supabase/server";
import { toInnovation } from "@/lib/data/innovations";
import { innovationSchema } from "@/lib/validators";
import { createAdminClient } from "@/lib/supabase/admin";
import { scrubPII } from "@/lib/admin/scrub";
import { rerank } from "@/lib/match/rerank";

/** Longest the response waits for the problem insert; the insert itself may finish later. */
export const PERSIST_WAIT_MS = 300;
/** Minimum number of nearest innovations fetched before the rerank. */
export const RERANK_POOL = 15;

export type TieredMatchResult = MatchResult & { tier: MatchTier };

export type MatchOutcome = {
  /** Best first, so "match" results come before "related" ones. */
  results: TieredMatchResult[];
  /** True when no result reached the "match" tier. */
  noGoodMatch: boolean;
  source: "ai" | "mock";
};

export type MatchOptions = {
  /**
   * Drop results below RELATED_THRESHOLD. `/match` sets it; callers that only
   * need the nearest innovations (assistant, institutions) keep every result.
   */
  hideWeak?: boolean;
  /**
   * Store the problem for admin trends. Only a problem submitted on `/match`
   * counts as a need; assistant questions and institution profiles do not.
   */
  record?: boolean;
};

/** Adds the tier to each result. Results below the related tier are dropped, or kept as "related" when not hiding. */
export function classifyResults(
  results: MatchResult[],
  hideWeak: boolean,
): Pick<MatchOutcome, "results" | "noGoodMatch"> {
  const tiered = results.flatMap((result): TieredMatchResult[] => {
    const tier = matchTier(result.score);
    if (!tier && hideWeak) return [];
    return [{ ...result, tier: tier ?? "related" }];
  });
  return {
    results: tiered,
    noGoodMatch: !tiered.some(({ tier }) => tier === "match"),
  };
}

function matchCount(results: TieredMatchResult[]): number {
  return results.filter(({ tier }) => tier === "match").length;
}

type ProblemRecord = {
  request: MatchRequest;
  /** Results in the "match" tier; with none the problem is stored as `new`. */
  resultCount: number;
  bestScore: number | null;
  source: "ai" | "mock";
  embedding?: number[];
};

// Stores the problem for the admin trends page. Uses the service role because
// anonymous visitors cannot insert under RLS. Never throws; logs lengths only.
async function persistProblem(record: ProblemRecord): Promise<void> {
  const admin = createAdminClient();
  if (!admin) return;
  try {
    const { error } = await admin
      .from("problems")
      .insert({
        description: scrubPII(record.request.problem),
        category: record.request.category?.trim() || null,
        embedding: record.embedding ?? null,
        status: record.resultCount ? "matched" : "new",
        best_score: record.bestScore,
        source: record.source,
      })
      .abortSignal(AbortSignal.timeout(3000));
    if (error) throw error;
  } catch {
    console.warn("Problem persistence failed", {
      problemLength: record.request.problem.length,
    });
  }
}

async function recordProblem(record: ProblemRecord): Promise<void> {
  if (!createAdminClient()) return;
  let timer: ReturnType<typeof setTimeout> | undefined;
  await Promise.race([
    persistProblem(record),
    new Promise<void>((resolve) => {
      timer = setTimeout(resolve, PERSIST_WAIT_MS);
    }),
  ]);
  clearTimeout(timer);
}

export function normalizeScore(score: number): number {
  return Number.isFinite(score)
    ? Math.round(Math.max(0, Math.min(1, score)) * 100) / 100
    : 0;
}

/** Keyword points at which a mock result reads as a 50% match. */
export const MOCK_HALF_POINTS = 4;
/** Mock matching is a rough fallback, so it never claims a perfect match. */
export const MOCK_MAX_SCORE = 0.95;

/**
 * Maps raw keyword points onto 0–1 on an absolute, saturating scale
 * (points / (points + MOCK_HALF_POINTS)), so ties stay ties but several
 * results no longer all show as 100%, and a weak best match stays weak.
 */
export function normalizeMockScores(results: MatchResult[]): MatchResult[] {
  return results.map((result) => {
    const points = Number.isFinite(result.score)
      ? Math.max(0, result.score)
      : 0;
    return {
      ...result,
      score: normalizeScore(
        Math.min(MOCK_MAX_SCORE, points / (points + MOCK_HALF_POINTS)),
      ),
    };
  });
}

async function fallback(
  request: MatchRequest,
  { hideWeak, record }: Required<MatchOptions>,
  cause: string,
  embedding?: number[],
): Promise<MatchOutcome> {
  console.warn("Match fallback", {
    cause,
    problemLength: request.problem.length,
  });
  const outcome = classifyResults(
    normalizeMockScores(mockMatch(request)),
    hideWeak,
  );
  if (record) {
    await recordProblem({
      request,
      resultCount: matchCount(outcome.results),
      bestScore: null,
      source: "mock",
      embedding,
    });
  }
  return { ...outcome, source: "mock" };
}

// Also bounds operations that ignore AbortSignal, without leaving a timer running.
async function withinDeadline<T>(
  work: PromiseLike<T>,
  signal: AbortSignal,
): Promise<T> {
  signal.throwIfAborted();
  let onAbort: () => void = () => {};
  try {
    return await Promise.race([
      Promise.resolve(work),
      new Promise<never>((_, reject) => {
        onAbort = () => reject(new Error("Match deadline exceeded"));
        signal.addEventListener("abort", onAbort, { once: true });
      }),
    ]);
  } finally {
    signal.removeEventListener("abort", onAbort);
  }
}

export async function matchProblem(
  request: MatchRequest,
  { hideWeak = false, record = false }: MatchOptions = {},
): Promise<MatchOutcome> {
  const options = { hideWeak, record };
  if (!hasSupabase || !hasOpenAI)
    return fallback(request, options, "configuration missing");
  const signal = AbortSignal.timeout(7500);
  let embedding: number[] | undefined;
  try {
    embedding = await withinDeadline(
      embedText(request.problem, signal),
      signal,
    );
    const client = await withinDeadline(createClient(), signal);
    if (!client)
      return fallback(request, options, "Supabase unavailable", embedding);
    const limit = request.limit ?? 5;
    // Fetch a wider pool than shown, so the keyword rerank can promote a close
    // runner-up (similarities are often within a few hundredths of each other).
    const { data, error } = await withinDeadline(
      client
        .rpc("match_innovations", {
          query_embedding: embedding,
          match_count: Math.max(limit * 3, RERANK_POOL),
        })
        .abortSignal(signal),
      signal,
    );
    if (error) return fallback(request, options, "RPC failed", embedding);
    if (!Array.isArray(data) || !data.length)
      return fallback(request, options, "RPC returned no rows", embedding);
    const similarity = new Map<string, number>(
      data.map((row) => [String(row.id), Number(row.similarity)]),
    );
    let candidates = data.map((row) => ({
      innovation: innovationSchema.parse(toInnovation(row)),
      similarity: Number(row.similarity),
    }));
    if (request.category) {
      const category = request.category.trim().toLocaleLowerCase("pl");
      candidates = candidates.filter(
        ({ innovation }) =>
          innovation.category.toLocaleLowerCase("pl") === category,
      );
    }
    const ranked: MatchResult[] = rerank(request.problem, candidates)
      .slice(0, limit)
      .map(({ innovation, score }) => ({
        innovation,
        score: normalizeScore(score),
        reason: "",
      }));
    // No candidates here means the category filter removed them all. That is
    // an answer ("nothing fits"), not a reason to switch to keyword results.
    const { results, noGoodMatch } = classifyResults(ranked, hideWeak);
    const topSimilarity = Math.max(
      ...ranked.map(({ innovation }) => similarity.get(innovation.id) ?? 0),
    );
    if (record) {
      await recordProblem({
        request,
        resultCount: matchCount(results),
        bestScore: Number.isFinite(topSimilarity) ? topSimilarity : null,
        source: "ai",
        embedding,
      });
    }
    // On /match a "related" result is shown without a "why it fits" text, so
    // only matches are explained there; other callers explain every result.
    const explained = results.filter(
      ({ tier }) => !hideWeak || tier === "match",
    );
    if (!explained.length) return { source: "ai", results, noGoodMatch };
    let reasons: Record<string, string> = {};
    try {
      reasons = await withinDeadline(
        generateReasons(
          request.problem,
          explained.map(({ innovation }) => innovation),
          signal,
        ),
        signal,
      );
    } catch {
      console.warn("Match reasons unavailable", {
        problemLength: request.problem.length,
      });
    }
    return {
      source: "ai",
      noGoodMatch,
      results: results.map((result) => ({
        ...result,
        reason: explained.includes(result)
          ? reasons[result.innovation.id] ||
            `Kategoria: ${result.innovation.category}. Dla kogo: ${result.innovation.targetGroup}.`
          : "",
      })),
    };
  } catch {
    return fallback(
      request,
      options,
      signal.aborted ? "timeout" : "embedding or search failed",
      embedding,
    );
  }
}
