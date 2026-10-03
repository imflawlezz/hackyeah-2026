"use client";

import { useMemo, useState } from "react";
import { FeedbackForm } from "@/components/testing/feedback-form";
import { ResultsSummary } from "@/components/testing/results-summary";
import { SignupForm, type TestingMode } from "@/components/testing/signup-form";
import type { OpenTest } from "@/lib/data/testing";
import { formatDateRange, slotsLeftText } from "@/lib/testing/format";
import { useLocalFeedback, useLocalSignups } from "@/lib/testing/local-store";
import { type FeedbackScores, summarizeFeedback } from "@/lib/testing/summary";
import type { FeedbackSummary } from "@/types";

export const NO_TESTS_TEXT =
  "Teraz nie ma otwartych testów tego rozwiązania. Możesz zostawić opinię poniżej.";

export function InnovationTesting({
  innovationId,
  tests,
  summary: initialSummary,
  demoScores,
  mode,
  signedUpTestIds = [],
  loginHref,
}: {
  innovationId: string;
  tests: OpenTest[];
  summary: FeedbackSummary;
  /** Demo mode: the mock opinions the local ones are added to. */
  demoScores: FeedbackScores[];
  mode: TestingMode;
  /** Signed in: tests the user already has a row for in test_signups. */
  signedUpTestIds?: string[];
  loginHref: string;
}) {
  const [serverSummary, setServerSummary] = useState(initialSummary);
  const localSignups = useLocalSignups();
  const localFeedback = useLocalFeedback();

  const summary = useMemo(() => {
    if (mode !== "demo") return serverSummary;
    return summarizeFeedback([
      ...demoScores,
      ...localFeedback.filter((entry) => entry.innovationId === innovationId),
    ]);
  }, [mode, serverSummary, demoScores, localFeedback, innovationId]);

  return (
    <div className="grid grid-cols-[minmax(0,1fr)] gap-x-16 gap-y-12 lg:grid-cols-[minmax(0,1fr)_21rem]">
      <div className="flex max-w-3xl flex-col gap-12">
        <section
          aria-labelledby="tests-heading"
          className="flex flex-col gap-6"
        >
          <h2
            id="tests-heading"
            className="font-heading text-2xl font-semibold"
          >
            Otwarte testy
          </h2>
          {tests.length === 0 ? (
            <p className="text-base">{NO_TESTS_TEXT}</p>
          ) : (
            tests.map((test) => {
              const localSignup =
                mode === "demo" && localSignups.includes(test.id);
              const signedUpHere =
                localSignup ||
                (mode === "signed-in" && signedUpTestIds.includes(test.id));
              // Server counts already include the user's own sign-up.
              const slotsLeft = test.slotsLeft - (localSignup ? 1 : 0);
              return (
                <article
                  key={test.id}
                  id={`test-${test.id}`}
                  aria-labelledby={`test-${test.id}-title`}
                  className="flex scroll-mt-4 flex-col gap-6 border-t border-border pt-6"
                >
                  <div className="flex flex-col gap-3">
                    <h3
                      id={`test-${test.id}-title`}
                      className="font-heading text-xl leading-snug font-semibold break-words"
                    >
                      {test.title}
                    </h3>
                    <p className="text-base">{test.description}</p>
                    <dl className="grid grid-cols-[minmax(0,1fr)] gap-x-8 gap-y-2 text-base sm:grid-cols-[8rem_minmax(0,1fr)]">
                      <dt className="font-semibold">Gmina</dt>
                      <dd>{test.municipality}</dd>
                      <dt className="font-semibold">Termin</dt>
                      <dd>{formatDateRange(test.startsAt, test.endsAt)}</dd>
                      <dt className="font-semibold">Miejsca</dt>
                      <dd>
                        {slotsLeftText(slotsLeft)} (z {test.slots})
                      </dd>
                    </dl>
                  </div>
                  <SignupForm
                    testId={test.id}
                    testTitle={test.title}
                    slotsLeft={slotsLeft}
                    alreadySignedUp={signedUpHere}
                    mode={mode}
                    loginHref={loginHref}
                  />
                </article>
              );
            })
          )}
        </section>

        <section
          aria-labelledby="feedback-heading"
          className="flex flex-col gap-6 border-t border-border pt-8"
        >
          <div className="flex flex-col gap-2">
            <h2
              id="feedback-heading"
              className="font-heading text-2xl font-semibold"
            >
              Twoja opinia
            </h2>
            <p className="text-base">
              Znasz to rozwiązanie albo brałeś lub brałaś udział w teście?
              Odpowiedz na kilka pytań. Wymagana jest tylko pierwsza ocena.
            </p>
          </div>
          <FeedbackForm
            innovationId={innovationId}
            testId={tests.length === 1 ? tests[0]!.id : undefined}
            mode={mode}
            loginHref={loginHref}
            onSummary={setServerSummary}
          />
        </section>
      </div>

      {/* TODO(#27): admin view with individual comments and signups */}
      <section
        aria-labelledby="results-heading"
        className="flex flex-col gap-4 border-t border-border pt-8 lg:sticky lg:top-4 lg:self-start lg:border-t-0 lg:border-l lg:pt-0 lg:pl-8"
      >
        <h2
          id="results-heading"
          className="font-heading text-2xl font-semibold"
        >
          Wyniki
        </h2>
        <div aria-live="polite">
          <ResultsSummary summary={summary} />
        </div>
      </section>
    </div>
  );
}
