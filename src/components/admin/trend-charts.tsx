"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  LabelList,
  Line,
  LineChart,
  ResponsiveContainer,
  XAxis,
  YAxis,
} from "recharts";
import { ChartSection } from "@/components/admin/chart-section";
import {
  formatPercent,
  formatWeek,
  UNMET_SCORE_THRESHOLD,
  type TrendReport,
} from "@/lib/admin/trends";

const AXIS = { fontSize: 14, fill: "var(--foreground)" };
const ROW_HEIGHT = 34;

function barHeight(rows: number) {
  return Math.max(120, rows * ROW_HEIGHT + 24);
}

/** Horizontal bars with the value written at the end of each bar. */
function HorizontalBars({
  data,
  dataKey,
  nameKey,
  color,
  label,
}: {
  data: object[];
  dataKey: string;
  nameKey: string;
  color: string;
  label?: (value: unknown) => string;
}) {
  return (
    <ResponsiveContainer width="100%" height={barHeight(data.length)}>
      <BarChart
        data={data}
        layout="vertical"
        margin={{ top: 4, right: 48, bottom: 4, left: 0 }}
        accessibilityLayer={false}
      >
        <CartesianGrid horizontal={false} stroke="var(--border)" />
        <XAxis type="number" hide allowDecimals={false} />
        <YAxis
          type="category"
          dataKey={nameKey}
          width={124}
          tick={AXIS}
          tickLine={false}
          axisLine={false}
          interval={0}
        />
        <Bar
          dataKey={dataKey}
          fill={color}
          radius={[0, 2, 2, 0]}
          barSize={20}
          isAnimationActive={false}
        >
          <LabelList
            dataKey={dataKey}
            position="right"
            style={{ fontSize: 14, fill: "var(--foreground)", fontWeight: 600 }}
            formatter={label ? (value: unknown) => label(value) : undefined}
          />
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

export function TrendCharts({
  report,
  summaries,
}: {
  report: TrendReport;
  summaries: {
    categories: string;
    weeks: string;
    unmet: string;
    keywords: string;
  };
}) {
  const weeks = report.byWeek.map((week) => ({
    ...week,
    label: formatWeek(week.week),
  }));
  const unmet = report.unmet.map((entry) => ({
    ...entry,
    percent: Math.round(entry.share * 100),
  }));

  return (
    <div className="flex flex-col gap-8">
      <ChartSection
        title="Zgłoszenia według kategorii"
        summary={summaries.categories}
        table={{
          caption: "Liczba zgłoszeń w każdej kategorii",
          columns: ["Kategoria", "Zgłoszenia"],
          rows: report.byCategory.map(({ category, count }) => [
            category,
            count,
          ]),
        }}
      >
        <HorizontalBars
          data={report.byCategory}
          dataKey="count"
          nameKey="category"
          color="var(--chart-1)"
        />
      </ChartSection>

      <ChartSection
        title="Zgłoszenia w kolejnych tygodniach"
        summary={summaries.weeks}
        table={{
          caption: "Liczba zgłoszeń w tygodniach (data to poniedziałek)",
          columns: ["Tydzień od", "Zgłoszenia"],
          rows: weeks.map(({ label, count }) => [label, count]),
        }}
      >
        <ResponsiveContainer width="100%" height={260}>
          <LineChart
            data={weeks}
            margin={{ top: 28, right: 32, bottom: 8, left: 8 }}
            accessibilityLayer={false}
          >
            <CartesianGrid vertical={false} stroke="var(--border)" />
            <XAxis
              dataKey="label"
              tick={AXIS}
              tickLine={false}
              interval="preserveStartEnd"
              minTickGap={16}
            />
            <YAxis
              allowDecimals={false}
              tick={AXIS}
              width={32}
              tickLine={false}
              axisLine={false}
            />
            <Line
              type="linear"
              dataKey="count"
              stroke="var(--chart-1)"
              strokeWidth={2.5}
              dot={{ r: 4, fill: "var(--chart-1)" }}
              isAnimationActive={false}
            >
              <LabelList
                dataKey="count"
                position="top"
                style={{ fontSize: 13, fill: "var(--foreground)" }}
              />
            </Line>
          </LineChart>
        </ResponsiveContainer>
      </ChartSection>

      <ChartSection
        title="Potrzeby bez dobrego rozwiązania"
        summary={summaries.unmet}
        note={`Bez dobrego rozwiązania to zgłoszenie bez żadnego dopasowania albo z najlepszym dopasowaniem AI poniżej ${String(UNMET_SCORE_THRESHOLD).replace(".", ",")}.`}
        table={{
          caption: "Udział zgłoszeń bez dobrego rozwiązania w kategorii",
          columns: ["Kategoria", "Bez rozwiązania", "Wszystkie", "Udział"],
          rows: unmet.map(({ category, unmet: count, total, share }) => [
            category,
            count,
            total,
            formatPercent(share),
          ]),
        }}
      >
        <HorizontalBars
          data={unmet}
          dataKey="percent"
          nameKey="category"
          color="var(--chart-4)"
          label={(value) => `${value}%`}
        />
      </ChartSection>

      <ChartSection
        title="Najczęstsze słowa w zgłoszeniach"
        summary={summaries.keywords}
        table={{
          caption:
            "15 najczęstszych słów (liczba zgłoszeń, w których występują)",
          columns: ["Słowo", "Zgłoszenia"],
          rows: report.keywords.map(({ word, count }) => [word, count]),
        }}
      >
        <HorizontalBars
          data={report.keywords}
          dataKey="count"
          nameKey="word"
          color="var(--chart-5)"
        />
      </ChartSection>
    </div>
  );
}
