import type { MatchResult } from "@/types";
import type { MatchSource } from "@/lib/api/match";

export type ScoreTier = "high" | "medium" | "low";

const HIGH_THRESHOLD = 0.75;
const MEDIUM_THRESHOLD = 0.5;

/**
 * Cosine similarity from text-embedding-3-small rarely leaves ~0.2–0.7 for
 * Polish problem descriptions, so that band is stretched to 0–1 for display.
 */
export const AI_SIMILARITY_FLOOR = 0.2;
export const AI_SIMILARITY_CEILING = 0.7;
/**
 * The best AI match shows as 100% once its calibrated score reaches this
 * value (raw similarity ≥ 0.5). A weaker best match is scaled less, so an
 * unrelated query still reads as a partial match.
 */
export const AI_TOP_REFERENCE = 0.6;

const TIER_LABELS: Record<ScoreTier, string> = {
  high: "Bardzo dobre dopasowanie",
  medium: "Dobre dopasowanie",
  low: "Częściowe dopasowanie",
};

function clamp01(value: number): number {
  return Number.isFinite(value) ? Math.min(1, Math.max(0, value)) : 0;
}

/** Maps a raw AI similarity onto 0–1 using the floor and ceiling above. */
export function calibrateSimilarity(similarity: number): number {
  return clamp01(
    (similarity - AI_SIMILARITY_FLOOR) /
      (AI_SIMILARITY_CEILING - AI_SIMILARITY_FLOOR),
  );
}

/**
 * Turns API scores into 0–1 display relevance. The API contract is unchanged:
 * scores stay in [0, 1].
 * - Mock results are already relative to the best match (top = 1), and raw
 *   keyword counts above 1 are divided by their maximum.
 * - AI results are calibrated, then scaled against the best match (with a
 *   floor of AI_TOP_REFERENCE) so a good top match reads as strong.
 */
export function toRelevance(
  results: MatchResult[],
  source: MatchSource = "unknown",
): number[] {
  const scores = results.map((result) => Math.max(0, result.score));
  const max = Math.max(0, ...scores);
  if (max > 1) {
    return scores.map((score) => score / max);
  }
  if (source === "mock") {
    return scores.map(clamp01);
  }
  const calibrated = scores.map(calibrateSimilarity);
  const reference = Math.max(AI_TOP_REFERENCE, ...calibrated);
  // Rounded like API scores, so tier boundaries are not missed by float error.
  return calibrated.map(
    (score) => Math.round(clamp01(score / reference) * 100) / 100,
  );
}

export function scoreTier(relevance: number): ScoreTier {
  if (relevance >= HIGH_THRESHOLD) {
    return "high";
  }
  if (relevance >= MEDIUM_THRESHOLD) {
    return "medium";
  }
  return "low";
}

export function scoreLabel(relevance: number): string {
  return TIER_LABELS[scoreTier(relevance)];
}

export function formatPercent(relevance: number): string {
  return `${Math.round(clamp01(relevance) * 100)}%`;
}
