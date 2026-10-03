"use client";

import { TableCellsIcon } from "@heroicons/react/20/solid";
import { useId, useState } from "react";
import { Button } from "@/components/ui/button";

export type ChartTable = {
  caption: string;
  columns: string[];
  rows: (string | number)[][];
};

/**
 * A chart with a heading, a one-sentence summary and a data-table alternative.
 * The chart itself is decorative for assistive tech; the summary and table carry the data.
 */
export function ChartSection({
  title,
  summary,
  note,
  table,
  children,
}: {
  title: string;
  summary: string;
  note?: string;
  table: ChartTable;
  children: React.ReactNode;
}) {
  const id = useId();
  const [showTable, setShowTable] = useState(false);

  return (
    <section
      aria-labelledby={`${id}-title`}
      className="flex min-w-0 flex-col gap-3 border-t border-border pt-6"
    >
      <h2 id={`${id}-title`} className="text-xl font-semibold">
        {title}
      </h2>
      <p>{summary}</p>
      {note && <p className="text-base text-muted-foreground">{note}</p>}
      {table.rows.length > 0 && (
        <>
          <div aria-hidden="true" className="w-full min-w-0 overflow-hidden">
            {children}
          </div>
          <div>
            <Button
              type="button"
              variant="outline"
              aria-expanded={showTable}
              aria-controls={`${id}-table`}
              onClick={() => setShowTable((value) => !value)}
              className="h-auto min-h-11 max-w-full py-2 text-base whitespace-normal"
            >
              <TableCellsIcon aria-hidden="true" className="size-5" />
              {showTable ? "Ukryj tabelę" : "Pokaż dane w tabeli"}
            </Button>
          </div>
          <div id={`${id}-table`} hidden={!showTable}>
            {showTable && (
              <table className="w-full max-w-2xl border-collapse text-base">
                <caption className="pb-2 text-left font-semibold">
                  {table.caption}
                </caption>
                <thead>
                  <tr className="border-b-2 border-border text-left">
                    {table.columns.map((column, index) => (
                      <th
                        key={column}
                        scope="col"
                        className={index ? "px-3 py-2 text-right" : "px-3 py-2"}
                      >
                        {column}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {table.rows.map((row) => (
                    <tr key={String(row[0])} className="border-b border-border">
                      {row.map((cell, index) =>
                        index === 0 ? (
                          <th
                            key={index}
                            scope="row"
                            className="px-3 py-2 text-left font-medium"
                          >
                            {cell}
                          </th>
                        ) : (
                          <td
                            key={index}
                            className="px-3 py-2 text-right tabular-nums"
                          >
                            {cell}
                          </td>
                        ),
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </>
      )}
    </section>
  );
}
