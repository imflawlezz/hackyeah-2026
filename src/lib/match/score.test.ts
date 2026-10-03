import { describe, expect, it } from "vitest";
import { innovations } from "@/lib/mocks";
import {
  calibrateSimilarity,
  formatPercent,
  scoreLabel,
  scoreTier,
  toRelevance,
} from "@/lib/match/score";
import type { MatchResult } from "@/types";

function withScores(...scores: number[]): MatchResult[] {
  return scores.map((score, index) => ({
    innovation: innovations[index % innovations.length]!,
    score,
    reason: "",
  }));
}

describe("toRelevance", () => {
  it("returns an empty list for no results", () => {
    expect(toRelevance([])).toEqual([]);
  });

  it("divides raw mock integer scores by the maximum", () => {
    expect(toRelevance(withScores(4, 2, 1))).toEqual([1, 0.5, 0.25]);
  });

  it("keeps normalised mock scores unchanged", () => {
    expect(toRelevance(withScores(1, 0.6, 0.2), "mock")).toEqual([1, 0.6, 0.2]);
  });

  it("treats a single raw score of 1 as already normalised", () => {
    expect(toRelevance(withScores(1))).toEqual([1]);
    expect(toRelevance(withScores(1), "mock")).toEqual([1]);
  });

  it("shows a typical best AI match as strong", () => {
    const relevance = toRelevance(withScores(0.45, 0.4, 0.25), "ai");
    expect(relevance.map(scoreLabel)).toEqual([
      "Bardzo dobre dopasowanie",
      "Dobre dopasowanie",
      "Częściowe dopasowanie",
    ]);
    expect(relevance.map(formatPercent)).toEqual(["83%", "67%", "17%"]);
  });

  it("gives the best AI match 100% once raw similarity reaches 0.5", () => {
    expect(toRelevance(withScores(0.5, 0.35), "ai")).toEqual([1, 0.5]);
    expect(toRelevance(withScores(0.82, 0.7), "ai")).toEqual([1, 1]);
  });

  it("keeps a weak best AI match partial", () => {
    const [top] = toRelevance(withScores(0.3, 0.22), "ai");
    expect(scoreTier(top!)).toBe("low");
  });

  it("calibrates unknown sources like AI scores", () => {
    expect(toRelevance(withScores(0.45), "unknown")).toEqual(
      toRelevance(withScores(0.45), "ai"),
    );
  });

  it("clamps negative scores to zero", () => {
    expect(toRelevance(withScores(3, -1))).toEqual([1, 0]);
  });
});

describe("calibrateSimilarity", () => {
  it("maps 0.2–0.7 onto 0–1 and clamps outside it", () => {
    expect(calibrateSimilarity(0.2)).toBe(0);
    expect(calibrateSimilarity(0.45)).toBeCloseTo(0.5);
    expect(calibrateSimilarity(0.7)).toBe(1);
    expect(calibrateSimilarity(0.1)).toBe(0);
    expect(calibrateSimilarity(0.95)).toBe(1);
    expect(calibrateSimilarity(Number.NaN)).toBe(0);
  });
});

describe("scoreLabel", () => {
  it.each([
    [1, "Bardzo dobre dopasowanie"],
    [0.75, "Bardzo dobre dopasowanie"],
    [0.74, "Dobre dopasowanie"],
    [0.5, "Dobre dopasowanie"],
    [0.49, "Częściowe dopasowanie"],
    [0, "Częściowe dopasowanie"],
  ])("labels %s as %s", (relevance, label) => {
    expect(scoreLabel(relevance)).toBe(label);
  });

  it("labels mock scores relative to the best match", () => {
    const labels = toRelevance(withScores(4, 3, 1)).map(scoreLabel);
    expect(labels).toEqual([
      "Bardzo dobre dopasowanie",
      "Bardzo dobre dopasowanie",
      "Częściowe dopasowanie",
    ]);
  });
});

describe("scoreTier and formatPercent", () => {
  it("maps relevance to tiers", () => {
    expect([0.9, 0.6, 0.1].map(scoreTier)).toEqual(["high", "medium", "low"]);
  });

  it("formats a clamped, rounded percentage", () => {
    expect(formatPercent(0.854)).toBe("85%");
    expect(formatPercent(1.2)).toBe("100%");
    expect(formatPercent(-0.1)).toBe("0%");
  });
});
