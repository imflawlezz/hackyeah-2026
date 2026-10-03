import { topKeywords, type KeywordCount } from "@/lib/admin/keywords";
import type { AdminProblem, TrendPeriod } from "@/lib/admin/types";

/**
 * A problem counts as "without a good solution" when it is still `new` (no
 * match was found) or its best cosine similarity is below this value. With
 * text-embedding-3-small, related Polish texts usually score 0.45–0.7 and
 * loosely related ones fall below 0.45. Mock matches store no score.
 */
export const UNMET_SCORE_THRESHOLD = 0.45;

export const NO_CATEGORY = "Bez kategorii";

const DAY_MS = 86_400_000;

export type TrendProblem = Pick<
  AdminProblem,
  "category" | "createdAt" | "status" | "bestScore" | "description"
>;

export type CategoryCount = { category: string; count: number };
export type WeekCount = { week: string; count: number };
export type UnmetShare = {
  category: string;
  total: number;
  unmet: number;
  share: number;
};

export interface TrendReport {
  period: TrendPeriod;
  total: number;
  byCategory: CategoryCount[];
  byWeek: WeekCount[];
  unmet: UnmetShare[];
  keywords: KeywordCount[];
}

export function isUnmet(problem: Pick<TrendProblem, "status" | "bestScore">) {
  return (
    problem.status === "new" ||
    (problem.bestScore !== null && problem.bestScore < UNMET_SCORE_THRESHOLD)
  );
}

export function filterByPeriod<T extends Pick<TrendProblem, "createdAt">>(
  problems: T[],
  period: TrendPeriod,
  now = new Date(),
): T[] {
  if (period === "all") return problems;
  const since = now.getTime() - Number(period) * DAY_MS;
  return problems.filter(
    ({ createdAt }) => new Date(createdAt).getTime() >= since,
  );
}

function categoryOf(problem: Pick<TrendProblem, "category">) {
  return problem.category?.trim() || NO_CATEGORY;
}

export function countByCategory(problems: TrendProblem[]): CategoryCount[] {
  const counts = new Map<string, number>();
  for (const problem of problems) {
    const category = categoryOf(problem);
    counts.set(category, (counts.get(category) ?? 0) + 1);
  }
  return [...counts]
    .map(([category, count]) => ({ category, count }))
    .sort(
      (a, b) => b.count - a.count || a.category.localeCompare(b.category, "pl"),
    );
}

/** Monday (UTC) of the ISO week containing `date`, as YYYY-MM-DD. */
export function weekStart(date: Date): string {
  const day = new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()),
  );
  day.setUTCDate(day.getUTCDate() - ((day.getUTCDay() + 6) % 7));
  return day.toISOString().slice(0, 10);
}

/** Problems per week, oldest first, with empty weeks filled in. */
export function countByWeek(problems: TrendProblem[]): WeekCount[] {
  if (!problems.length) return [];
  const counts = new Map<string, number>();
  for (const { createdAt } of problems) {
    const week = weekStart(new Date(createdAt));
    counts.set(week, (counts.get(week) ?? 0) + 1);
  }
  const weeks = [...counts.keys()].sort();
  const result: WeekCount[] = [];
  const cursor = new Date(`${weeks[0]}T00:00:00Z`);
  const last = weeks[weeks.length - 1];
  while (cursor.toISOString().slice(0, 10) <= last) {
    const week = cursor.toISOString().slice(0, 10);
    result.push({ week, count: counts.get(week) ?? 0 });
    cursor.setUTCDate(cursor.getUTCDate() + 7);
  }
  return result;
}

/** Categories ranked by the share of problems without a good solution. */
export function unmetByCategory(problems: TrendProblem[]): UnmetShare[] {
  const totals = new Map<string, { total: number; unmet: number }>();
  for (const problem of problems) {
    const category = categoryOf(problem);
    const entry = totals.get(category) ?? { total: 0, unmet: 0 };
    entry.total++;
    if (isUnmet(problem)) entry.unmet++;
    totals.set(category, entry);
  }
  return [...totals]
    .map(([category, { total, unmet }]) => ({
      category,
      total,
      unmet,
      share: unmet / total,
    }))
    .sort(
      (a, b) =>
        b.share - a.share ||
        b.unmet - a.unmet ||
        a.category.localeCompare(b.category, "pl"),
    );
}

export function buildTrendReport(
  problems: TrendProblem[],
  period: TrendPeriod,
  now = new Date(),
  { keywordMinCount = 1 }: { keywordMinCount?: number } = {},
): TrendReport {
  const inPeriod = filterByPeriod(problems, period, now);
  return {
    period,
    total: inPeriod.length,
    byCategory: countByCategory(inPeriod),
    byWeek: countByWeek(inPeriod),
    unmet: unmetByCategory(inPeriod),
    keywords: topKeywords(
      inPeriod.map(({ description }) => description),
      15,
      keywordMinCount,
    ),
  };
}

export function parsePeriod(value: unknown): TrendPeriod {
  return value === "30" || value === "90" || value === "all" ? value : "90";
}

export function formatPercent(share: number): string {
  return `${Math.round(share * 100)}%`;
}

export function formatWeek(week: string): string {
  return new Date(`${week}T00:00:00Z`).toLocaleDateString("pl-PL", {
    day: "numeric",
    month: "short",
    timeZone: "UTC",
  });
}
