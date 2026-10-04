"use client";

import {
  ExclamationCircleIcon,
  ArrowPathIcon,
  ArrowRightIcon,
  FlagIcon,
} from "@heroicons/react/20/solid";
import Link from "next/link";
import type { Ref } from "react";
import { MatchResultCard } from "@/components/match/match-result-card";
import { Button, buttonVariants } from "@/components/ui/button";
import type { MatchSource, TieredMatchResult } from "@/lib/api/match";
import { CHALLENGE_HREF } from "@/lib/match/challenge-draft";
import { foundInnovationsText } from "@/lib/match/plural";
import { cn } from "@/lib/utils";

export const LOADING_TEXT = "Porównujemy opis z bazą innowacji…";
export const NO_MATCH_TITLE =
  "Nie mamy jeszcze rozwiązania, które pasuje do Twojego opisu";
export const NO_MATCH_TEXT =
  "To ważna informacja dla ROPS. Zgłoś problem jako nowe wyzwanie. Zespół Hubu sprawdzi, czy można znaleźć lub wypracować rozwiązanie.";
export const NO_MATCH_ACTION = "Zgłoś nowe wyzwanie";
export const RELATED_TITLE = "Mniej powiązane rozwiązania";
export const RELATED_HINT =
  "Mogą dotyczyć podobnego tematu, ale nie odpowiadają wprost na Twój problem.";
export const MOCK_SOURCE_NOTE =
  "Wyniki pochodzą z przykładowej bazy. Porównujemy słowa i kategorię z Twoim opisem.";

export type MatchState =
  | { status: "idle" }
  | { status: "loading" }
  | {
      status: "success";
      /** Best first; "match" results come before "related" ones. */
      results: TieredMatchResult[];
      /** Display relevance of the "match" results, in their order. */
      relevance: number[];
      noGoodMatch: boolean;
      source: MatchSource;
    }
  | { status: "error"; message: string };

const SKELETON_CARDS = 3;

const LINK_CLASSES =
  "inline-flex min-h-11 items-center gap-2 text-base font-semibold text-primary underline underline-offset-4 hover:no-underline";

function split(results: TieredMatchResult[]) {
  return {
    matches: results.filter(({ tier }) => tier === "match"),
    related: results.filter(({ tier }) => tier === "related"),
  };
}

function relatedCountText(count: number): string {
  return `Niżej są mniej powiązane rozwiązania: ${count}.`;
}

function announcement(state: MatchState): string {
  switch (state.status) {
    case "loading":
      return LOADING_TEXT;
    case "success": {
      const { matches, related } = split(state.results);
      const main =
        state.noGoodMatch || matches.length === 0
          ? `${NO_MATCH_TITLE}. Możesz zgłosić nowe wyzwanie.`
          : `${foundInnovationsText(matches.length)}.`;
      return related.length > 0
        ? `${main} ${relatedCountText(related.length)}`
        : main;
    }
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
  const { matches, related } =
    state.status === "success"
      ? split(state.results)
      : { matches: [], related: [] };
  const noGoodMatch =
    state.status === "success" && (state.noGoodMatch || matches.length === 0);

  return (
    <section
      aria-labelledby={
        state.status === "success" || state.status === "error"
          ? "match-results-heading"
          : undefined
      }
      className="flex scroll-mt-4 flex-col gap-10"
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
          <ul className="flex flex-col divide-y divide-border">
            {Array.from({ length: SKELETON_CARDS }, (_, index) => (
              <li
                key={index}
                className="flex flex-col gap-2.5 rounded-md border border-border p-6"
              >
                <div className="h-5 w-24 rounded-sm bg-muted motion-safe:animate-pulse" />
                <div className="h-6 w-3/4 rounded-md bg-muted motion-safe:animate-pulse" />
                <div className="h-4 w-1/2 rounded-md bg-muted motion-safe:animate-pulse" />
                <div className="h-16 w-full rounded-md bg-muted motion-safe:animate-pulse" />
              </li>
            ))}
          </ul>
        </div>
      )}

      {state.status === "success" && !noGoodMatch && (
        <div className="flex flex-col gap-4">
          <div>
            <h2
              id="match-results-heading"
              ref={headingRef}
              tabIndex={-1}
              className="rounded-sm text-2xl font-semibold"
            >
              {foundInnovationsText(matches.length)}
            </h2>
            {state.source === "ai" && (
              <p className="mt-2 text-base text-muted-foreground">
                Tekst przygotowany automatycznie. Sprawdź go przed wysłaniem.
              </p>
            )}
            {state.source === "mock" && (
              <p className="mt-1 text-sm text-muted-foreground">
                {MOCK_SOURCE_NOTE}
              </p>
            )}
          </div>
          <ul className="flex flex-col divide-y divide-border">
            {matches.map((result, index) => (
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

      {state.status === "success" && noGoodMatch && (
        <div className="flex flex-col items-start gap-4 rounded-md border-2 border-primary bg-background p-6 sm:flex-row">
          <FlagIcon
            aria-hidden="true"
            className="mt-1 size-6 shrink-0 text-primary"
          />
          <div className="flex min-w-0 flex-col items-start gap-4">
            <h2
              id="match-results-heading"
              ref={headingRef}
              tabIndex={-1}
              className="rounded-sm text-2xl font-semibold text-balance"
            >
              {NO_MATCH_TITLE}
            </h2>
            <p className="max-w-[70ch] text-base">{NO_MATCH_TEXT}</p>
            <Link
              href={CHALLENGE_HREF}
              className={cn(
                buttonVariants(),
                "h-auto min-h-11 max-w-full gap-2 px-4 py-2 text-base whitespace-normal",
              )}
            >
              {NO_MATCH_ACTION}
              <ArrowRightIcon aria-hidden="true" className="size-5 shrink-0" />
            </Link>
            <ul className="flex flex-col gap-x-6 sm:flex-row sm:flex-wrap">
              <li>
                <Link href="/ideas/new" className={LINK_CLASSES}>
                  Zaproponuj własny pomysł
                </Link>
              </li>
              <li>
                <Link href="/knowledge?tab=challenges" className={LINK_CLASSES}>
                  Zobacz wyzwania regionu
                </Link>
              </li>
            </ul>
            <p className="text-base text-muted-foreground">
              Możesz też opisać problem innymi słowami albo wybrać inną
              kategorię.
            </p>
            {state.source === "mock" && (
              <p className="text-sm text-muted-foreground">
                {MOCK_SOURCE_NOTE}
              </p>
            )}
          </div>
        </div>
      )}

      {state.status === "success" && related.length > 0 && (
        <section
          aria-labelledby="match-related-heading"
          className="flex flex-col gap-2"
        >
          <h2 id="match-related-heading" className="text-xl font-semibold">
            {RELATED_TITLE}
          </h2>
          <p className="text-base text-muted-foreground">{RELATED_HINT}</p>
          <ul className="flex flex-col divide-y divide-border">
            {related.map((result) => (
              <li key={result.innovation.id}>
                <MatchResultCard result={result} related />
              </li>
            ))}
          </ul>
        </section>
      )}

      {state.status === "error" && (
        <div
          role="alert"
          className="flex flex-col items-start gap-4 rounded-md border-2 border-destructive bg-background p-6 sm:flex-row"
        >
          <ExclamationCircleIcon
            aria-hidden="true"
            className="size-5 shrink-0 text-destructive"
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
              className="h-auto min-h-11 gap-2 px-4 py-2 [&_svg:not([class*='size-'])]:size-5"
            >
              <ArrowPathIcon aria-hidden="true" className="size-5" />
              Spróbuj ponownie
            </Button>
          </div>
        </div>
      )}
    </section>
  );
}
