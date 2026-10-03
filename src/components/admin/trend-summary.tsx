"use client";

import { DocumentTextIcon } from "@heroicons/react/20/solid";
import { useState } from "react";
import { summarizeTrendsAction } from "@/app/admin/actions";
import { useAdminAction } from "@/components/admin/use-admin-action";
import { Button } from "@/components/ui/button";
import type { TrendPeriod } from "@/lib/admin/types";

export const AI_LABEL =
  "Tekst przygotowany automatycznie. Sprawdź go przed użyciem.";

export function TrendSummary({
  period,
  fallbackText,
}: {
  period: TrendPeriod;
  fallbackText: string;
}) {
  const { pending, message, run } = useAdminAction();
  const [summary, setSummary] = useState<{
    text: string;
    source: "ai" | "fallback";
  } | null>(null);

  return (
    <section
      aria-labelledby="summary-heading"
      className="flex flex-col gap-3 rounded-md border border-border p-4 sm:p-5"
    >
      <h2 id="summary-heading" className="text-xl font-semibold">
        Podsumowanie okresu
      </h2>
      {summary ? (
        <div className="flex flex-col gap-2">
          <p>{summary.text}</p>
          <p className="text-base text-muted-foreground">
            {summary.source === "ai"
              ? AI_LABEL
              : "Podsumowanie ułożone z liczb, bez AI."}
          </p>
        </div>
      ) : (
        <p>{fallbackText}</p>
      )}
      <div>
        <Button
          type="button"
          variant="outline"
          className="h-auto min-h-11 max-w-full py-2 text-base whitespace-normal"
          aria-disabled={pending || undefined}
          onClick={() => {
            if (pending) return;
            run(
              () => summarizeTrendsAction(period),
              (result) => {
                if ("text" in result && result.text && result.source) {
                  setSummary({ text: result.text, source: result.source });
                }
              },
            );
          }}
        >
          <DocumentTextIcon aria-hidden="true" className="size-5" />
          {pending ? "Przygotowuję podsumowanie…" : "Przygotuj podsumowanie"}
        </Button>
      </div>
      <p role="status" aria-live="polite" className="sr-only">
        {pending ? "Przygotowuję podsumowanie…" : message}
      </p>
    </section>
  );
}
