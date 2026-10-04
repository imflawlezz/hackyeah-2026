import type { Metadata } from "next";
import { pageAccess } from "@/app/admin/access";
import { AdminPageHeader, Notice } from "@/components/admin/page-header";
import { TrendCharts } from "@/components/admin/trend-charts";
import { TrendSummary } from "@/components/admin/trend-summary";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { canWrite } from "@/lib/auth/admin";
import { getTrendProblems } from "@/lib/admin/repository";
import {
  deterministicSummary,
  describeCategories,
  describeKeywords,
  describeUnmet,
  describeWeeks,
  reportsText,
} from "@/lib/admin/summary";
import { buildTrendReport, parsePeriod } from "@/lib/admin/trends";
import { TREND_PERIODS } from "@/lib/admin/types";

export const metadata: Metadata = { title: "Trendy potrzeb" };

export default async function TrendsPage({
  searchParams,
}: PageProps<"/admin/trends">) {
  const access = await pageAccess();
  if (access.mode === "denied") return null;
  const period = parsePeriod((await searchParams).period);
  const { data, notice } = await getTrendProblems(access);
  // Only aggregates leave the server. Preview hides rare words that could identify a report.
  const report = buildTrendReport(data, period, new Date(), {
    keywordMinCount: access.mode === "preview" ? 2 : 1,
  });
  const periodLabel =
    TREND_PERIODS.find(({ value }) => value === period)?.label ?? "";

  return (
    <>
      <AdminPageHeader
        title="Trendy potrzeb"
        description="Zbiorcze dane o problemach wpisanych w wyszukiwarce rozwiązań. Widoczne tylko dla administratorów."
      />
      {notice && <Notice>{notice}</Notice>}

      <form
        method="get"
        className="flex flex-wrap items-end gap-2.5"
        aria-label="Okres"
      >
        <div className="flex flex-col gap-2">
          <Label htmlFor="period" className="text-base font-semibold">
            Okres
          </Label>
          <select
            id="period"
            name="period"
            defaultValue={period}
            className="min-h-11 rounded-md border border-input bg-background px-2.5 text-base text-foreground outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring"
          >
            {TREND_PERIODS.map(({ value, label }) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>
        <Button
          type="submit"
          variant="outline"
          className="h-auto min-h-11 max-w-full py-2 text-base whitespace-normal"
        >
          Pokaż
        </Button>
      </form>

      <p className="text-lg">
        <span className="font-semibold">{periodLabel}:</span>{" "}
        {reportsText(report.total)}.
      </p>

      {canWrite(access.mode) ? (
        <TrendSummary
          key={period}
          period={period}
          fallbackText={deterministicSummary(report)}
        />
      ) : (
        <section
          aria-labelledby="summary-heading"
          className="flex flex-col gap-2 rounded-md border border-border p-4 sm:p-5"
        >
          <h2 id="summary-heading" className="text-xl font-semibold">
            Podsumowanie okresu
          </h2>
          <p>{deterministicSummary(report)}</p>
        </section>
      )}

      <TrendCharts
        report={report}
        summaries={{
          categories: describeCategories(report),
          weeks: describeWeeks(report),
          unmet: describeUnmet(report),
          keywords: describeKeywords(report),
        }}
      />
    </>
  );
}
