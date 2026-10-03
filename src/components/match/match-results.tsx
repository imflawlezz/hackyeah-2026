"use client";

import { CircleAlertIcon, RotateCcwIcon, SearchXIcon } from "lucide-react";
import type { Ref } from "react";
import { MatchResultCard } from "@/components/match/match-result-card";
import { Button } from "@/components/ui/button";
import type { MatchSource } from "@/lib/api/match";
import { foundInnovationsText } from "@/lib/match/plural";
import type { MatchResult } from "@/types";

export const LOADING_TEXT = "Szukam pasujących innowacji…";
export const EMPTY_TITLE = "Nie znaleźliśmy pasujących innowacji.";
export const EMPTY_HINT =
  "Opisz problem innymi słowami albo wybierz inną kategorię.";
export const MOCK_SOURCE_NOTE = "Wyniki demonstracyjne (tryb bez AI).";

export type MatchState =
  | { status: "idle" }
  | { status: "loading" }
  | {
      status: "success";
      results: MatchResult[];
      relevance: number[];
      source: MatchSource;
    }
  | { status: "error"; message: string };

const SKELETON_CARDS = 3;

function announcement(state: MatchState): string {
  switch (state.status) {
    case "loading":
      return LOADING_TEXT;
    case "success":
      return state.results.length > 0
        ? `${foundInnovationsText(state.results.length)}.`
        : `${EMPTY_TITLE} ${EMPTY_HINT}`;
    default:
      // Errors are announced by their own role="alert" box.
      return "";
  }
}

export function MatchResults({
  state,
  headingRef,
  onRetry,
}: {
  state: MatchState;
  headingRef: Ref<HTMLHeadingElement>;
  onRetry: () => void;
}) {
  return (
    <section
      aria-labelledby={
        state.status === "success" || state.status === "error"
          ? "match-results-heading"
          : undefined
      }
      className="scroll-mt-4"
    >
      <p
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
      >
        {announcement(state)}
      </p>

      {state.status === "loading" && (
        <div aria-hidden="true" className="flex flex-col gap-4">
          <div className="h-8 w-2/3 max-w-md rounded-md bg-muted motion-safe:animate-pulse" />
          <ul className="grid gap-4 md:grid-cols-2">
            {Array.from({ length: SKELETON_CARDS }, (_, index) => (
              <li
                key={index}
                className="flex flex-col gap-3 rounded-xl border border-border p-6"
              >
                <div className="h-5 w-24 rounded-full bg-muted motion-safe:animate-pulse" />
                <div className="h-6 w-3/4 rounded-md bg-muted motion-safe:animate-pulse" />
                <div className="h-4 w-1/2 rounded-md bg-muted motion-safe:animate-pulse" />
                <div className="h-16 w-full rounded-md bg-muted motion-safe:animate-pulse" />
              </li>
            ))}
          </ul>
        </div>
      )}

      {state.status === "success" && state.results.length > 0 && (
        <div className="flex flex-col gap-4">
          <div>
            <h2
              id="match-results-heading"
              ref={headingRef}
              tabIndex={-1}
              className="rounded-sm text-2xl font-semibold tracking-tight"
            >
              {foundInnovationsText(state.results.length)}
            </h2>
            {state.source === "mock" && (
              <p className="mt-1 text-sm text-muted-foreground">
                {MOCK_SOURCE_NOTE}
              </p>
            )}
          </div>
          <ul className="grid gap-4 md:grid-cols-2">
            {state.results.map((result, index) => (
              <li key={result.innovation.id}>
                <MatchResultCard
                  result={result}
                  relevance={state.relevance[index] ?? 0}
                  showPercent={state.source === "ai"}
                />
              </li>
            ))}
          </ul>
        </div>
      )}

      {state.status === "success" && state.results.length === 0 && (
        <div className="flex flex-col items-start gap-3 rounded-xl border border-dashed border-border p-6 sm:flex-row">
          <SearchXIcon aria-hidden="true" className="size-8 shrink-0" />
          <div>
            <h2
              id="match-results-heading"
              ref={headingRef}
              tabIndex={-1}
              className="rounded-sm text-xl font-semibold"
            >
              {EMPTY_TITLE}
            </h2>
            <p className="mt-1 text-base">{EMPTY_HINT}</p>
            {state.source === "mock" && (
              <p className="mt-2 text-sm text-muted-foreground">
                {MOCK_SOURCE_NOTE}
              </p>
            )}
          </div>
        </div>
      )}

      {state.status === "error" && (
        <div
          role="alert"
          className="flex flex-col items-start gap-4 rounded-xl border-2 border-destructive bg-background p-6 sm:flex-row"
        >
          <CircleAlertIcon
            aria-hidden="true"
            className="size-8 shrink-0 text-destructive"
          />
          <div className="flex flex-col items-start gap-4">
            <h2
              id="match-results-heading"
              ref={headingRef}
              tabIndex={-1}
              className="rounded-sm text-xl font-semibold"
            >
              {state.message}
            </h2>
            <Button
              type="button"
              variant="outline"
              onClick={onRetry}
              className="h-auto min-h-11 gap-2 px-4 py-2 text-base [&_svg:not([class*='size-'])]:size-5"
            >
              <RotateCcwIcon aria-hidden="true" />
              Spróbuj ponownie
            </Button>
          </div>
        </div>
      )}
    </section>
  );
}
