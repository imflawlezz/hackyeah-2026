import type { MatchRequest, MatchResult } from "@/types";
import { mockMatch } from "@/lib/mocks";
import { embedText } from "@/lib/ai/embeddings";
import { generateReasons } from "@/lib/ai/reasons";
import { hasOpenAI } from "@/lib/ai/models";
import { createClient, hasSupabase } from "@/lib/supabase/server";
import { toInnovation } from "@/lib/data/innovations";
import { innovationSchema } from "@/lib/validators";

export function normalizeScore(score: number): number {
  return Number.isFinite(score)
    ? Math.round(Math.max(0, Math.min(1, score)) * 100) / 100
    : 0;
}

export function normalizeMockScores(results: MatchResult[]): MatchResult[] {
  const highest = Math.max(0, ...results.map(({ score }) => score));
  return results.map((result) => ({
    ...result,
    score: normalizeScore(highest ? result.score / highest : 0),
  }));
}

function fallback(request: MatchRequest, cause: string) {
  console.warn("Match fallback", {
    cause,
    problemLength: request.problem.length,
  });
  return {
    results: normalizeMockScores(mockMatch(request)),
    source: "mock" as const,
  };
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
  try {
    const embedding = await withinDeadline(
      embedText(request.problem, signal),
      signal,
    );
    const client = await withinDeadline(createClient(), signal);
    if (!client) return fallback(request, "Supabase unavailable");
    const limit = request.limit ?? 5;
    const { data, error } = await withinDeadline(
      client
        .rpc("match_innovations", {
          query_embedding: embedding,
          match_count: request.category ? limit * 3 : limit,
        })
        .abortSignal(signal),
      signal,
    );
    if (error) return fallback(request, "RPC failed");
    if (!Array.isArray(data) || !data.length)
      return fallback(request, "RPC returned no rows");
    let results: MatchResult[] = data.map((row) => ({
      innovation: innovationSchema.parse(toInnovation(row)),
      score: normalizeScore(Number(row.similarity)),
      reason: "",
    }));
    if (request.category) {
      const category = request.category.trim().toLocaleLowerCase("pl");
      results = results.filter(
        ({ innovation }) =>
          innovation.category.toLocaleLowerCase("pl") === category,
      );
    }
    results = results.sort((a, b) => b.score - a.score).slice(0, limit);
    if (!results.length) return fallback(request, "no category matches");
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
    );
  }
}
