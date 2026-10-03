import { describe, expect, it } from "vitest";
import { getMockTrendProblems } from "@/lib/mocks/trends";
import {
  buildTrendReport,
  countByCategory,
  countByWeek,
  filterByPeriod,
  isUnmet,
  NO_CATEGORY,
  parsePeriod,
  UNMET_SCORE_THRESHOLD,
  unmetByCategory,
  weekStart,
  type TrendProblem,
} from "@/lib/admin/trends";
import { deterministicSummary, reportsText } from "@/lib/admin/summary";

const NOW = new Date("2026-10-03T12:00:00Z");
const problems = getMockTrendProblems(NOW);

function problem(overrides: Partial<TrendProblem>): TrendProblem {
  return {
    category: "Opieka",
    createdAt: "2026-10-01T10:00:00Z",
    status: "matched",
    bestScore: 0.7,
    description: "opis",
    ...overrides,
  };
}

describe("mock trend data", () => {
  it("has about 60 problems over 12 weeks in all 8 categories", () => {
    expect(problems).toHaveLength(60);
    expect(new Set(problems.map(({ category }) => category)).size).toBe(8);
    expect(countByWeek(problems).length).toBeGreaterThanOrEqual(12);
    expect(problems.every(({ createdAt }) => new Date(createdAt) <= NOW)).toBe(
      true,
    );
  });
});

describe("trend aggregation", () => {
  it("counts per category, largest first, and sums to the total", () => {
    const byCategory = countByCategory(problems);
    expect(byCategory[0]).toEqual({ category: "Samotność", count: 11 });
    expect(byCategory.at(-1)).toEqual({ category: "Bezdomność", count: 4 });
    expect(byCategory.reduce((sum, { count }) => sum + count, 0)).toBe(60);
    expect(countByCategory([problem({ category: null })])).toEqual([
      { category: NO_CATEGORY, count: 1 },
    ]);
  });

  it("groups by ISO week starting on Monday and fills empty weeks", () => {
    expect(weekStart(new Date("2026-10-03T12:00:00Z"))).toBe("2026-09-28");
    expect(weekStart(new Date("2026-09-28T00:00:00Z"))).toBe("2026-09-28");
    const weeks = countByWeek([
      problem({ createdAt: "2026-09-01T10:00:00Z" }),
      problem({ createdAt: "2026-09-02T10:00:00Z" }),
      problem({ createdAt: "2026-09-16T10:00:00Z" }),
    ]);
    expect(weeks).toEqual([
      { week: "2026-08-31", count: 2 },
      { week: "2026-09-07", count: 0 },
      { week: "2026-09-14", count: 1 },
    ]);
    expect(
      countByWeek(problems).reduce((sum, { count }) => sum + count, 0),
    ).toBe(60);
    expect(countByWeek([])).toEqual([]);
  });

  it("treats new problems and weak best scores as unmet", () => {
    expect(isUnmet(problem({ status: "new", bestScore: null }))).toBe(true);
    expect(isUnmet(problem({ bestScore: UNMET_SCORE_THRESHOLD - 0.01 }))).toBe(
      true,
    );
    expect(isUnmet(problem({ bestScore: UNMET_SCORE_THRESHOLD }))).toBe(false);
    expect(isUnmet(problem({ bestScore: null }))).toBe(false);
  });

  it("ranks categories by unmet share", () => {
    const unmet = unmetByCategory(problems);
    expect(unmet.slice(0, 2)).toEqual([
      { category: "Zdrowie psychiczne", total: 8, unmet: 6, share: 0.75 },
      { category: "Bezdomność", total: 4, unmet: 3, share: 0.75 },
    ]);
    const shares = unmet.map(({ share }) => share);
    expect(shares).toEqual([...shares].sort((a, b) => b - a));
    const care = unmet.find(({ category }) => category === "Opieka");
    expect(care).toMatchObject({ total: 10, unmet: 3 });
  });

  it("filters by period relative to now", () => {
    expect(filterByPeriod(problems, "all", NOW)).toHaveLength(60);
    const month = filterByPeriod(problems, "30", NOW);
    expect(month.length).toBeGreaterThan(10);
    expect(month.length).toBeLessThan(
      filterByPeriod(problems, "90", NOW).length,
    );
    expect(parsePeriod("30")).toBe("30");
    expect(parsePeriod("7")).toBe("90");
  });

  it("builds a report and a deterministic summary without new numbers", () => {
    const report = buildTrendReport(problems, "all", NOW);
    expect(report.total).toBe(60);
    expect(report.keywords).toHaveLength(15);
    const summary = deterministicSummary(report);
    expect(summary).toContain(
      "Najwięcej zgłoszeń dotyczyło kategorii Samotność (11)",
    );
    expect(summary).toContain("Zdrowie psychiczne: 6 z 8 (75%)");
    expect(deterministicSummary(buildTrendReport([], "30", NOW))).toBe(
      "W wybranym okresie nie ma zgłoszeń.",
    );
  });

  it("uses Polish plural forms for report counts", () => {
    expect([1, 3, 5, 22].map(reportsText)).toEqual([
      "1 zgłoszenie",
      "3 zgłoszenia",
      "5 zgłoszeń",
      "22 zgłoszenia",
    ]);
  });
});
