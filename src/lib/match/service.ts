import type { MatchRequest, MatchResult } from "@/types";
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

type ProblemRecord = {
  request: MatchRequest;
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
  cause: string,
  embedding?: number[],
) {
  console.warn("Match fallback", {
    cause,
    problemLength: request.problem.length,
  });
  const results = normalizeMockScores(mockMatch(request));
  await recordProblem({
    request,
    resultCount: results.length,
    bestScore: null,
    source: "mock",
    embedding,
  });
  return { results, source: "mock" as const };
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
): Promise<{ results: MatchResult[]; source: "ai" | "mock" }> {
  if (!hasSupabase || !hasOpenAI)
    return fallback(request, "configuration missing");
  const signal = AbortSignal.timeout(7500);
  let embedding: number[] | undefined;
  try {
    embedding = await withinDeadline(
      embedText(request.problem, signal),
      signal,
    );
    const client = await withinDeadline(createClient(), signal);
    if (!client) return fallback(request, "Supabase unavailable", embedding);
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
    if (error) return fallback(request, "RPC failed", embedding);
    if (!Array.isArray(data) || !data.length)
      return fallback(request, "RPC returned no rows", embedding);
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
    const results: MatchResult[] = rerank(request.problem, candidates)
      .slice(0, limit)
      .map(({ innovation, score }) => ({
        innovation,
        score: normalizeScore(score),
        reason: "",
      }));
    if (!results.length)
      return fallback(request, "no category matches", embedding);
    const topSimilarity = Math.max(
      ...results.map(({ innovation }) => similarity.get(innovation.id) ?? 0),
    );
    await recordProblem({
      request,
      resultCount: results.length,
      bestScore: Number.isFinite(topSimilarity) ? topSimilarity : null,
      source: "ai",
      embedding,
    });
    let reasons: Record<string, string> = {};
    try {
      reasons = await withinDeadline(
        generateReasons(
          request.problem,
          results.map(({ innovation }) => innovation),
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
      results: results.map((result) => ({
        ...result,
        reason:
          reasons[result.innovation.id] ||
          `Kategoria: ${result.innovation.category}. Dla kogo: ${result.innovation.targetGroup}.`,
      })),
    };
  } catch {
    return fallback(
      request,
      signal.aborted ? "timeout" : "embedding or search failed",
      embedding,
    );
  }
}
