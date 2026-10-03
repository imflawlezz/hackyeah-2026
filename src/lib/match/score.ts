import type { MatchResult } from "@/types";

export type ScoreTier = "high" | "medium" | "low";

const HIGH_THRESHOLD = 0.75;
const MEDIUM_THRESHOLD = 0.5;

const TIER_LABELS: Record<ScoreTier, string> = {
  high: "Bardzo dobre dopasowanie",
  medium: "Dobre dopasowanie",
  low: "Częściowe dopasowanie",
};

/**
 * Normalises scores to 0–1. The mock matcher returns raw keyword-hit counts,
 * the AI matcher returns 0–1 similarity, so any score above 1 means the list
 * is on the raw scale and is divided by its maximum.
 */
export function toRelevance(results: MatchResult[]): number[] {
  const scores = results.map((result) => Math.max(0, result.score));
  const max = Math.max(0, ...scores);
  if (max > 1) {
    return scores.map((score) => score / max);
  }
  return scores;
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
  return `${Math.round(Math.min(1, Math.max(0, relevance)) * 100)}%`;
}
