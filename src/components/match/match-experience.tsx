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
}: {
  initialValues?: MatchFormValues;
  autoRun?: boolean;
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
        relevance: toRelevance(results),
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

  function handleRetry() {
    if (lastRequestRef.current) {
      void runSearch(lastRequestRef.current);
    }
  }

  return (
    <div className="flex flex-col gap-10">
      <MatchForm
        defaultValues={initialValues}
        loading={state.status === "loading"}
        onSearch={handleSearch}
      />
      <MatchResults
        state={state}
        headingRef={headingRef}
        onRetry={handleRetry}
      />
    </div>
  );
}

/** Reads ?q= and ?category= — must be rendered inside <Suspense>. */
export function MatchExperienceFromUrl() {
  const searchParams = useSearchParams();
  const problem = searchParams.get("q") ?? "";
  const requestedCategory = searchParams.get("category") ?? "";
  const category = CATEGORIES.includes(requestedCategory)
    ? requestedCategory
    : "";

  return (
    <MatchExperience
      initialValues={{ problem, category }}
      autoRun={problem.trim().length > 0}
    />
  );
}
