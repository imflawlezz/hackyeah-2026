"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Label } from "@/components/ui/label";
import { buttonVariants } from "@/components/ui/button";
import type { OpenTest } from "@/lib/data/testing";
import { distinctSorted } from "@/lib/knowledge/filter";
import {
  formatDateRange,
  slotsLeftText,
  testsText,
} from "@/lib/testing/format";
import { useLocalSignups } from "@/lib/testing/local-store";
import { cn } from "@/lib/utils";

export const NO_OPEN_TESTS_TEXT = "Teraz nie ma otwartych testów.";

const ROW_GRID =
  "grid grid-cols-[minmax(0,1fr)] gap-x-8 gap-y-2.5 md:grid-cols-[minmax(0,2fr)_minmax(0,1fr)_minmax(0,1.4fr)_minmax(0,1fr)_10rem] md:items-center";

function testHref(test: OpenTest): string {
  return `/test/${encodeURIComponent(test.innovationId)}#test-${test.id}`;
}

export function OpenTestsList({
  tests,
  demo,
  signedUpTestIds = [],
}: {
  tests: OpenTest[];
  /** Demo mode: sign-ups stored in this browser reduce the slots shown. */
  demo: boolean;
  /** Signed in: tests the user already signed up for. */
  signedUpTestIds?: string[];
}) {
  const [municipality, setMunicipality] = useState("");
  const localSignups = useLocalSignups();
  const municipalities = useMemo(
    () => distinctSorted(tests.map((test) => test.municipality)),
    [tests],
  );
  const selected = municipalities.includes(municipality) ? municipality : "";
  const visible = selected
    ? tests.filter((test) => test.municipality === selected)
    : tests;

  if (tests.length === 0) {
    return <p className="text-lg">{NO_OPEN_TESTS_TEXT}</p>;
  }

  return (
    <div className="flex flex-col gap-6">
      <p
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className="text-base font-semibold"
      >
        Otwarte testy: {testsText(visible.length)}
      </p>
      <div className="flex flex-col gap-2 sm:max-w-xs">
        <Label htmlFor="tests-municipality" className="text-base font-semibold">
          Gmina
        </Label>
        <select
          id="tests-municipality"
          value={selected}
          onChange={(event) => setMunicipality(event.target.value)}
          className="min-h-12 w-full rounded-md border border-input bg-background px-2.5 text-base text-foreground outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
        >
          <option value="">Wszystkie gminy</option>
          {municipalities.map((name) => (
            <option key={name} value={name}>
              {name}
            </option>
          ))}
        </select>
      </div>

      <div>
        <div
          aria-hidden="true"
          className={cn(
            ROW_GRID,
            "hidden border-b border-border pb-2 text-sm font-semibold text-muted-foreground md:grid",
          )}
        >
          <span>Innowacja</span>
          <span>Gmina</span>
          <span>Termin</span>
          <span>Miejsca</span>
          <span />
        </div>
        <ul>
          {visible.map((test) => {
            const titleId = `open-test-${test.id}-title`;
            const localSignup = demo && localSignups.includes(test.id);
            const signedUp = localSignup || signedUpTestIds.includes(test.id);
            const slotsLeft = test.slotsLeft - (localSignup ? 1 : 0);
            return (
              <li
                key={test.id}
                aria-labelledby={titleId}
                className={cn(ROW_GRID, "border-b border-border py-6")}
              >
                <div className="flex flex-col gap-1">
                  <h2
                    id={titleId}
                    className="font-heading text-xl leading-snug font-semibold break-words"
                  >
                    <Link
                      href={testHref(test)}
                      className="rounded-sm text-heading underline underline-offset-4 hover:decoration-2"
                    >
                      {test.innovationTitle}
                    </Link>
                  </h2>
                  <p className="text-base">{test.title}</p>
                </div>
                <p className="text-base">
                  <span className="font-semibold md:sr-only">Gmina: </span>
                  {test.municipality}
                </p>
                <p className="text-base">
                  <span className="font-semibold md:sr-only">Termin: </span>
                  {formatDateRange(test.startsAt, test.endsAt)}
                </p>
                <p className="text-base">
                  <span className="sr-only">Miejsca: </span>
                  {slotsLeftText(slotsLeft)}
                </p>
                <div>
                  <Link
                    href={testHref(test)}
                    className={cn(
                      buttonVariants({
                        variant: "outline",
                      }),
                      "h-auto min-h-11 gap-2 px-4 py-2 text-base whitespace-normal",
                    )}
                  >
                    {signedUp
                      ? "Zapisano: zobacz test"
                      : slotsLeft > 0
                        ? "Zgłoś się"
                        : "Zobacz test"}
                    <span className="sr-only">: {test.innovationTitle}</span>
                  </Link>
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
