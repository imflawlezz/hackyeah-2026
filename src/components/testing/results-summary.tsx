import { formatDecimal, formatShare, opinionsText } from "@/lib/testing/format";
import { RATING_OPTIONS } from "@/lib/testing/schemas";
import type { FeedbackSummary } from "@/types";

export const NO_FEEDBACK_TEXT =
  "Nie ma jeszcze opinii o tym rozwiązaniu. Twoja może być pierwsza.";

/** Aggregates only: averages, the rating distribution and the recommend share. */
export function ResultsSummary({ summary }: { summary: FeedbackSummary }) {
  if (summary.count === 0 || summary.avgRating === null) {
    return <p className="text-base">{NO_FEEDBACK_TEXT}</p>;
  }

  const highest = Math.max(...Object.values(summary.distribution));

  return (
    <div className="flex flex-col gap-6">
      <p className="text-lg">
        <span className="font-semibold">Średnia ocena:</span>{" "}
        <span className="text-3xl font-semibold text-heading tabular-nums">
          {formatDecimal(summary.avgRating)}
        </span>{" "}
        z 5 ({opinionsText(summary.count)})
      </p>

      {/* The table is the chart: counts as text, bars as decoration. */}
      <table className="w-full border-collapse text-base">
        <caption className="mb-2 text-left font-semibold">Rozkład ocen</caption>
        <thead className="sr-only">
          <tr>
            <th scope="col">Ocena</th>
            <th scope="col">Liczba opinii</th>
          </tr>
        </thead>
        <tbody>
          {[...RATING_OPTIONS].reverse().map(({ value, label }) => {
            const count = summary.distribution[value];
            return (
              <tr key={value} className="border-t border-border">
                <th
                  scope="row"
                  className="w-px py-2 pr-4 text-left font-normal whitespace-nowrap"
                >
                  {label}
                </th>
                <td className="w-px py-2 pr-2.5 text-right font-semibold tabular-nums">
                  {count}
                </td>
                <td aria-hidden="true" className="py-2">
                  <div className="h-4 w-full border border-border bg-muted">
                    <div
                      className="h-full bg-primary"
                      style={{
                        width: `${highest ? (count / highest) * 100 : 0}%`,
                      }}
                    />
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      <dl className="grid grid-cols-[minmax(0,1fr)_auto] gap-x-6 gap-y-2.5 border-t border-border pt-4 text-base">
        {summary.recommendShare !== null && (
          <>
            <dt className="font-semibold">Poleca</dt>
            <dd className="text-right tabular-nums">
              {formatShare(summary.recommendShare)}
            </dd>
          </>
        )}
        {summary.avgEase !== null && (
          <>
            <dt className="font-semibold">Na ile proste</dt>
            <dd className="text-right tabular-nums">
              {formatDecimal(summary.avgEase)} z 5
            </dd>
          </>
        )}
      </dl>
    </div>
  );
}
