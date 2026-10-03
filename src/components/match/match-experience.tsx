"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  CATEGORIES,
  MatchForm,
  type MatchFormValues,
  matchFormSchema,
} from "@/components/match/match-form";
import {
  MatchResults,
  type MatchState,
} from "@/components/match/match-results";
import {
  fetchMatches,
  GENERIC_MATCH_ERROR,
  MatchApiError,
} from "@/lib/api/match";
import { toRelevance } from "@/lib/match/score";
import type { MatchRequest } from "@/types";

const USER_FACING_STATUSES = new Set([400, 429]);

function errorMessage(error: unknown): string {
  if (
    error instanceof MatchApiError &&
    error.status !== undefined &&
    USER_FACING_STATUSES.has(error.status)
  ) {
    return error.message;
  }
  return GENERIC_MATCH_ERROR;
}

function toRequest(values: MatchFormValues): MatchRequest {
  return {
    problem: values.problem,
    ...(values.category ? { category: values.category } : {}),
  };
}

function focusLost(): boolean {
  return (
    typeof document !== "undefined" &&
    (document.activeElement === null ||
      document.activeElement === document.body)
  );
}

export function MatchExperience({
  initialValues = { problem: "", category: "" },
  autoRun = false,
  signedIn = false,
}: {
  initialValues?: MatchFormValues;
  autoRun?: boolean;
  signedIn?: boolean;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [state, setState] = useState<MatchState>({ status: "idle" });
  const abortRef = useRef<AbortController | null>(null);
  const lastRequestRef = useRef<MatchRequest | null>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);

  const runSearch = useCallback(async (request: MatchRequest) => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    lastRequestRef.current = request;
    setState({ status: "loading" });

    try {
      const { results, source } = await fetchMatches(
        request,
        controller.signal,
      );
      if (controller.signal.aborted) return;
      setState({
        status: "success",
        results,
        relevance: toRelevance(results, source),
        source,
      });
    } catch (error) {
      if (controller.signal.aborted) return;
      setState({ status: "error", message: errorMessage(error) });
    }
  }, []);

  // Auto-run once for links such as /match?q=samotni%20seniorzy.
  const initialRequestRef = useRef(
    autoRun && matchFormSchema.safeParse(initialValues).success
      ? toRequest(matchFormSchema.parse(initialValues))
      : null,
  );
  useEffect(() => {
    const request = initialRequestRef.current;
    if (request) {
      void runSearch(request);
    }
    return () => abortRef.current?.abort();
  }, [runSearch]);

  useEffect(() => {
    if (state.status === "success") {
      headingRef.current?.focus();
    } else if (state.status === "error" && focusLost()) {
      // The retry button unmounts while loading; don't leave focus on <body>.
      headingRef.current?.focus();
    }
  }, [state]);

  function handleSearch(values: MatchFormValues) {
    const request = toRequest(values);
    const params = new URLSearchParams({ q: request.problem });
    if (request.category) {
      params.set("category", request.category);
    }
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    void runSearch(request);
  }

  // Stale results under an invalid field look like answers to the new text.
  function handleInvalid() {
    abortRef.current?.abort();
    setState({ status: "idle" });
  }

  function handleRetry() {
    if (lastRequestRef.current) {
      void runSearch(lastRequestRef.current);
    }
  }

  return (
    <div className="flex flex-col gap-10">
      <div className="grid items-start gap-10 lg:grid-cols-[minmax(0,7fr)_minmax(0,3fr)]">
        <MatchForm
          signedIn={signedIn}
          defaultValues={initialValues}
          loading={state.status === "loading"}
          onSearch={handleSearch}
          onInvalid={handleInvalid}
        />
        <aside
          aria-labelledby="writing-tips-heading"
          className="rounded-md border border-border bg-muted p-6"
        >
          <h2 id="writing-tips-heading" className="text-xl font-semibold">
            Jak dobrze opisać problem
          </h2>
          <ul className="mt-4 list-disc space-y-3 pl-5 text-base">
            <li>
              Napisz, kto potrzebuje wsparcia, na przykład seniorzy lub
              opiekunowie.
            </li>
            <li>Wskaż miejsce, na przykład gminę, osiedle lub świetlicę.</li>
            <li>Podaj konkretną trudność i to, czego dziś brakuje.</li>
          </ul>
          <p className="mt-6 border-t border-border pt-4 text-base font-semibold">
            Nie wpisuj imion, nazwisk ani adresów.
          </p>
        </aside>
      </div>
      <MatchResults
        state={state}
        headingRef={headingRef}
        onRetry={handleRetry}
      />
    </div>
  );
}

/** Reads ?q= and ?category=. Must be rendered inside <Suspense>. */
export function MatchExperienceFromUrl({
  signedIn = false,
}: {
  signedIn?: boolean;
}) {
  const searchParams = useSearchParams();
  const problem = searchParams.get("q") ?? "";
  const requestedCategory = searchParams.get("category") ?? "";
  const category = CATEGORIES.includes(requestedCategory)
    ? requestedCategory
    : "";

  return (
    <MatchExperience
      signedIn={signedIn}
      initialValues={{ problem, category }}
      autoRun={problem.trim().length > 0}
    />
  );
}
