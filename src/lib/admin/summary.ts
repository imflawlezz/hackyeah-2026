import {
  formatPercent,
  formatWeek,
  type TrendReport,
} from "@/lib/admin/trends";

const pluralRules = new Intl.PluralRules("pl");

/** "1 zgłoszenie", "3 zgłoszenia", "5 zgłoszeń". */
export function reportsText(count: number): string {
  const category = pluralRules.select(count);
  const noun =
    category === "one"
      ? "zgłoszenie"
      : category === "few"
        ? "zgłoszenia"
        : "zgłoszeń";
  return `${count} ${noun}`;
}

export function describeCategories(report: TrendReport): string {
  const [first, second] = report.byCategory;
  if (!first) return "W tym okresie nie ma zgłoszeń.";
  const rest = second ? `, potem ${second.category} (${second.count})` : "";
  return `Najwięcej zgłoszeń dotyczyło kategorii ${first.category} (${first.count})${rest}.`;
}

export function describeWeeks(report: TrendReport): string {
  if (!report.byWeek.length) return "W tym okresie nie ma zgłoszeń.";
  const peak = report.byWeek.reduce((best, week) =>
    week.count > best.count ? week : best,
  );
  const last = report.byWeek[report.byWeek.length - 1];
  return `Najwięcej zgłoszeń wpłynęło w tygodniu od ${formatWeek(peak.week)} (${peak.count}). W ostatnim tygodniu: ${reportsText(last.count)}.`;
}

export function describeUnmet(report: TrendReport): string {
  const top = report.unmet.find(({ unmet }) => unmet > 0);
  if (!top)
    return "Dla każdego zgłoszenia z tego okresu znaleźliśmy dobre dopasowanie.";
  return `Najczęściej bez dobrego rozwiązania zostają zgłoszenia z kategorii ${top.category}: ${top.unmet} z ${top.total} (${formatPercent(top.share)}).`;
}

export function describeKeywords(report: TrendReport): string {
  if (!report.keywords.length)
    return "Za mało zgłoszeń, żeby wskazać częste słowa.";
  const words = report.keywords
    .slice(0, 5)
    .map(({ word }) => word)
    .join(", ");
  return `Najczęściej powtarzane słowa to: ${words}.`;
}

/** Summary built only from the aggregates; used when AI is unavailable. */
export function deterministicSummary(report: TrendReport): string {
  if (!report.total) return "W wybranym okresie nie ma zgłoszeń.";
  return [
    `Liczba zgłoszeń w wybranym okresie: ${report.total}.`,
    describeCategories(report),
    describeUnmet(report),
    describeKeywords(report),
  ].join(" ");
}
