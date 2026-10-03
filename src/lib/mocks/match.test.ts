import { describe, expect, it } from "vitest";
import { mockMatch } from "@/lib/mocks";
import { matchRequestSchema } from "@/lib/validators";
import type { MatchResult } from "@/types";

describe("mockMatch", () => {
  it("ranks the after-school innovation first for a youth care problem", () => {
    const request = matchRequestSchema.parse({
      problem: "świetlica dla młodzieży po lekcjach",
      category: "Młodzież",
      limit: 1,
    });

    const results: MatchResult[] = mockMatch(request);

    expect(results).toHaveLength(1);
    expect(results[0]?.innovation.id).toBe("inn-after-school");
    expect(results[0]?.score).toBeGreaterThan(0);
    expect(results[0]?.reason).toContain("Wspólne słowa");
  });

  it("returns no matches for an unrelated problem", () => {
    expect(mockMatch({ problem: "xyzqwerty" })).toEqual([]);
    expect(matchRequestSchema.safeParse({ limit: 1 }).success).toBe(false);
  });

  it("boosts the requested category when keywords do not match", () => {
    const results = mockMatch({
      problem: "xyzqwerty",
      category: "Młodzież",
      limit: 5,
    });

    expect(results.length).toBeGreaterThan(0);
    expect(
      results.every((result) => result.innovation.category === "Młodzież"),
    ).toBe(true);
    expect(results.map((result) => result.score)).toEqual(
      [...results.map((result) => result.score)].sort(
        (left, right) => right - left,
      ),
    );
  });
});
