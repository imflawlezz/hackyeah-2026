import type { Feedback, FeedbackSummary, Rating } from "@/types";

export const RATINGS: readonly Rating[] = [1, 2, 3, 4, 5];

/** The three numbers a summary needs; no comments, no author. */
export type FeedbackScores = Pick<
  Feedback,
  "rating" | "easeOfUse" | "wouldRecommend"
>;

export const EMPTY_SUMMARY: FeedbackSummary = {
  count: 0,
  avgRating: null,
  distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
  avgEase: null,
  recommendShare: null,
};

function average(values: number[]): number | null {
  if (values.length === 0) return null;
  const sum = values.reduce((total, value) => total + value, 0);
  return Math.round((sum / values.length) * 100) / 100;
}

/** Same maths as the innovation_feedback_summary SQL function. */
export function summarizeFeedback(
  entries: readonly FeedbackScores[],
): FeedbackSummary {
  const distribution: Record<Rating, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  for (const { rating } of entries) distribution[rating] += 1;

  const recommendations = entries
    .map(({ wouldRecommend }) => wouldRecommend)
    .filter((value) => value !== undefined);

  return {
    count: entries.length,
    avgRating: average(entries.map(({ rating }) => rating)),
    distribution,
    avgEase: average(
      entries
        .map(({ easeOfUse }) => easeOfUse)
        .filter((value) => value !== undefined),
    ),
    recommendShare:
      recommendations.length === 0
        ? null
        : Math.round(
            (recommendations.filter(Boolean).length / recommendations.length) *
              10000,
          ) / 10000,
  };
}
