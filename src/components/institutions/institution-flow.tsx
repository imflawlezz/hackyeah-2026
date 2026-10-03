"use client";

import {
  ArrowDownTrayIcon,
  ClipboardDocumentIcon,
  ExclamationCircleIcon,
  PrinterIcon,
} from "@heroicons/react/20/solid";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { PlanDocument } from "@/components/institutions/plan-document";
import { ProfileForm } from "@/components/institutions/profile-form";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  fetchCandidates,
  fetchPlan,
  GENERIC_CANDIDATES_ERROR,
  GENERIC_PLAN_ERROR,
  InstitutionApiError,
} from "@/lib/api/institutions";
import type { MatchSource } from "@/lib/api/match";
import { planToMarkdown } from "@/lib/institutions/plan-markdown";
import { foundInnovationsText } from "@/lib/match/plural";
import { scoreLabel, toRelevance } from "@/lib/match/score";
import { normalizeText } from "@/lib/knowledge/filter";
import { cn } from "@/lib/utils";
import type {
  ImplementationPlan,
  Innovation,
  InstitutionProfile,
  MatchResult,
} from "@/types";

export const CANDIDATES_LOADING_TEXT = "Szukam pasujących rozwiązań…";
export const PLAN_LOADING_TEXT =
  "Przygotowuję plan. To może potrwać do 20 sekund.";
export const PLAN_READY_TEXT = "Plan jest gotowy.";
export const NO_CANDIDATES_TEXT =
  "Nie znaleźliśmy rozwiązań do tego opisu. Zmień opis potrzeby albo grupy i spróbuj ponownie.";
export const MOCK_SOURCE_NOTE = "Wyniki demonstracyjne (tryb bez AI).";

type Stage =
  | { step: "profile" }
  | { step: "candidates" }
  | { step: "plan"; plan: ImplementationPlan; innovation: Innovation };

type Busy = null | "candidates" | "plan";

type Candidates = { results: MatchResult[]; source: MatchSource };

const ACTION_CLASSES =
  "h-auto min-h-11 max-w-full shrink gap-2 px-4 py-2 text-left text-base whitespace-normal";

function errorMessage(error: unknown, fallback: string): string {
  return error instanceof InstitutionApiError ? error.message : fallback;
}

function fileName(title: string): string {
  const slug = normalizeText(title)
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  return `plan-wdrozenia-${slug || "innowacja"}.md`;
}

export function InstitutionFlow({
  preselected,
  preselectedMissing = false,
}: {
  /** The innovation from /institutions?innovation=…; skips candidate selection. */
  preselected: Innovation | null;
  /** The URL named an innovation that does not exist. */
  preselectedMissing?: boolean;
}) {
  const [stage, setStage] = useState<Stage>({ step: "profile" });
  const [busy, setBusy] = useState<Busy>(null);
  const [error, setError] = useState<string | null>(null);
  const [announcement, setAnnouncement] = useState("");
  const [actionStatus, setActionStatus] = useState("");
  const [profile, setProfile] = useState<InstitutionProfile | null>(null);
  const [candidates, setCandidates] = useState<Candidates | null>(null);
  const [chosenId, setChosenId] = useState("");
  const abortRef = useRef<AbortController | null>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const totalSteps = preselected ? 2 : 3;

  useEffect(() => () => abortRef.current?.abort(), []);

  // Each step replaces the previous one, so focus moves to its heading.
  const focusedStep = useRef<Stage["step"]>("profile");
  useEffect(() => {
    if (focusedStep.current === stage.step) return;
    focusedStep.current = stage.step;
    headingRef.current?.focus();
  }, [stage]);

  function startRequest(kind: Exclude<Busy, null>, text: string) {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    setBusy(kind);
    setError(null);
    setActionStatus("");
    setAnnouncement(text);
    return controller;
  }

  async function loadCandidates(nextProfile: InstitutionProfile) {
    const controller = startRequest("candidates", CANDIDATES_LOADING_TEXT);
    try {
      const { candidates: results, source } = await fetchCandidates(
        nextProfile,
        controller.signal,
      );
      if (controller.signal.aborted) return;
      setCandidates({ results, source });
      setChosenId(results[0]?.innovation.id ?? "");
      setStage({ step: "candidates" });
      setAnnouncement(
        results.length > 0
          ? `${foundInnovationsText(results.length)}.`
          : NO_CANDIDATES_TEXT,
      );
    } catch (caught) {
      if (controller.signal.aborted) return;
      setError(errorMessage(caught, GENERIC_CANDIDATES_ERROR));
      setAnnouncement("");
    } finally {
      if (abortRef.current === controller) setBusy(null);
    }
  }

  async function loadPlan(
    nextProfile: InstitutionProfile,
    innovationId: string,
  ) {
    const controller = startRequest("plan", PLAN_LOADING_TEXT);
    try {
      const result = await fetchPlan(
        { ...nextProfile, innovationId },
        innovationId,
        controller.signal,
      );
      if (controller.signal.aborted) return;
      setStage({ step: "plan", ...result });
      setAnnouncement(PLAN_READY_TEXT);
    } catch (caught) {
      if (controller.signal.aborted) return;
      setError(errorMessage(caught, GENERIC_PLAN_ERROR));
      setAnnouncement("");
    } finally {
      if (abortRef.current === controller) setBusy(null);
    }
  }

  function handleProfile(nextProfile: InstitutionProfile) {
    setProfile(nextProfile);
    if (preselected) {
      void loadPlan(nextProfile, preselected.id);
    } else {
      void loadCandidates(nextProfile);
    }
  }

  function cancel() {
    abortRef.current?.abort();
    abortRef.current = null;
    setBusy(null);
    setAnnouncement("Przerwano. Możesz zmienić dane i spróbować ponownie.");
  }

  function retry() {
    if (!profile) return;
    if (preselected) {
      void loadPlan(profile, preselected.id);
    } else if (stage.step === "candidates" && chosenId) {
      void loadPlan(profile, chosenId);
    } else {
      void loadCandidates(profile);
    }
  }

  function markdown(): string | null {
    if (stage.step !== "plan" || !profile) return null;
    return planToMarkdown(stage.plan, stage.innovation, profile);
  }

  function downloadMarkdown() {
    const content = markdown();
    if (!content || stage.step !== "plan") return;
    const url = URL.createObjectURL(
      new Blob([content], { type: "text/markdown;charset=utf-8" }),
    );
    const link = document.createElement("a");
    link.href = url;
    link.download = fileName(stage.innovation.title);
    document.body.append(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    setActionStatus("Plik z planem został pobrany.");
  }

  async function copyMarkdown() {
    const content = markdown();
    if (!content) return;
    try {
      await navigator.clipboard.writeText(content);
      setActionStatus("Plan skopiowany do schowka jako Markdown.");
    } catch {
      setActionStatus(
        "Nie udało się skopiować planu. Pobierz plik .md albo zaznacz tekst ręcznie.",
      );
    }
  }

  const stepNumber =
    stage.step === "profile" ? 1 : stage.step === "candidates" ? 2 : totalSteps;
  const relevance = candidates
    ? toRelevance(candidates.results, candidates.source)
    : [];

  return (
    <div className="flex flex-col gap-8">
      <p
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
      >
        {announcement}
      </p>

      {busy && (
        <div className="flex flex-col items-start gap-4 border-l-4 border-primary py-2 pl-4 print:hidden">
          <p aria-hidden="true" className="text-lg font-semibold">
            {busy === "plan" ? PLAN_LOADING_TEXT : CANDIDATES_LOADING_TEXT}
          </p>
          <Button
            type="button"
            variant="outline"
            onClick={cancel}
            className={ACTION_CLASSES}
          >
            Przerwij
          </Button>
        </div>
      )}

      {error && !busy && (
        <div
          role="alert"
          className="flex flex-col items-start gap-4 rounded-md border-2 border-destructive p-4 print:hidden"
        >
          <p className="flex items-start gap-2 text-base font-semibold">
            <ExclamationCircleIcon
              aria-hidden="true"
              className="mt-0.5 size-5 shrink-0 text-destructive"
            />
            {error}
          </p>
          <Button
            type="button"
            variant="outline"
            onClick={retry}
            className={ACTION_CLASSES}
          >
            Spróbuj ponownie
          </Button>
        </div>
      )}

      {stage.step !== "plan" && (
        <p className="text-base font-semibold text-muted-foreground">
          Krok {stepNumber} z {totalSteps}
        </p>
      )}

      {/* The form stays mounted so the answers are kept when coming back. */}
      <section
        aria-labelledby="profile-heading"
        hidden={stage.step !== "profile"}
        className="flex flex-col gap-8"
      >
        <h2
          id="profile-heading"
          ref={stage.step === "profile" ? headingRef : undefined}
          tabIndex={-1}
          className="rounded-sm text-2xl font-semibold"
        >
          Opisz instytucję i potrzebę
        </h2>

        {preselectedMissing && (
          <p className="max-w-3xl border-l-4 border-primary pl-4 text-base">
            Nie znaleźliśmy innowacji wskazanej w adresie. Dobierzemy
            rozwiązanie na podstawie Twojego opisu.
          </p>
        )}
        {preselected && (
          <div className="flex max-w-3xl flex-col gap-1 border-l-4 border-primary pl-4 text-base">
            <p>
              <span className="font-semibold">Wybrana innowacja:</span>{" "}
              {preselected.title} ({preselected.category})
            </p>
            <p>
              <Link
                href="/institutions"
                className="inline-flex min-h-11 items-center rounded-sm text-primary underline underline-offset-4 hover:decoration-2"
              >
                Zmień innowację
              </Link>
            </p>
          </div>
        )}

        <ProfileForm
          submitLabel={preselected ? "Przygotuj plan" : "Dobierz rozwiązania"}
          busy={busy !== null}
          onSubmit={handleProfile}
        />
      </section>

      {stage.step === "candidates" && candidates && (
        <section
          aria-labelledby="candidates-heading"
          className="flex max-w-3xl flex-col gap-6"
        >
          <div className="flex flex-col gap-2">
            <h2
              id="candidates-heading"
              ref={headingRef}
              tabIndex={-1}
              className="rounded-sm text-2xl font-semibold"
            >
              Wybierz rozwiązanie
            </h2>
            {candidates.source === "mock" && (
              <p className="text-sm text-muted-foreground">
                {MOCK_SOURCE_NOTE}
              </p>
            )}
          </div>

          {candidates.results.length === 0 ? (
            <p className="text-base">{NO_CANDIDATES_TEXT}</p>
          ) : (
            <form
              aria-label="Wybór rozwiązania"
              onSubmit={(event) => {
                event.preventDefault();
                if (profile && chosenId && !busy) {
                  void loadPlan(profile, chosenId);
                }
              }}
              className="flex flex-col gap-6"
            >
              <fieldset className="flex flex-col">
                <legend className="mb-2 text-lg font-semibold">
                  Dla którego rozwiązania przygotować plan?
                </legend>
                {candidates.results.map(({ innovation, reason }, index) => (
                  <label
                    key={innovation.id}
                    className="grid cursor-pointer grid-cols-[1.25rem_minmax(0,1fr)] gap-x-4 border-t border-border py-5 last:border-b"
                  >
                    <input
                      type="radio"
                      name="candidate"
                      value={innovation.id}
                      checked={chosenId === innovation.id}
                      onChange={() => setChosenId(innovation.id)}
                      className="mt-1.5 size-5 accent-primary"
                    />
                    <span className="flex flex-col gap-1">
                      <span className="text-xl leading-snug font-semibold text-heading">
                        {innovation.title}
                      </span>
                      <span className="text-base">
                        <span className="font-semibold">Dla kogo:</span>{" "}
                        {innovation.targetGroup}
                      </span>
                      {reason && <span className="text-base">{reason}</span>}
                      <span className="text-sm font-semibold">
                        {scoreLabel(relevance[index] ?? 0)}
                      </span>
                    </span>
                  </label>
                ))}
              </fieldset>
              <div className="flex flex-wrap gap-3">
                <Button
                  type="submit"
                  aria-disabled={busy !== null || undefined}
                  className="h-auto min-h-12 px-6 py-3 text-lg font-semibold whitespace-normal"
                >
                  Przygotuj plan
                </Button>
              </div>
            </form>
          )}

          <div>
            <Button
              type="button"
              variant="outline"
              onClick={() => setStage({ step: "profile" })}
              className={ACTION_CLASSES}
            >
              Zmień opis instytucji
            </Button>
          </div>
        </section>
      )}

      {stage.step === "plan" && profile && (
        <section aria-label="Plan wdrożenia" className="flex flex-col gap-8">
          <div className="flex flex-col gap-3 print:hidden">
            <div className="flex flex-wrap gap-3">
              <Button
                type="button"
                onClick={() => window.print()}
                className={ACTION_CLASSES}
              >
                <PrinterIcon aria-hidden="true" className="size-5" />
                Drukuj lub zapisz jako PDF
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={downloadMarkdown}
                className={ACTION_CLASSES}
              >
                <ArrowDownTrayIcon aria-hidden="true" className="size-5" />
                Pobierz plik .md
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => void copyMarkdown()}
                className={ACTION_CLASSES}
              >
                <ClipboardDocumentIcon aria-hidden="true" className="size-5" />
                Kopiuj jako Markdown
              </Button>
              <Link
                href={`/messages/new?${new URLSearchParams({
                  innovation: stage.innovation.id,
                  kind: "ask_rops",
                }).toString()}`}
                className={cn(
                  buttonVariants({ variant: "outline" }),
                  ACTION_CLASSES,
                )}
              >
                Zapytaj ROPS o wdrożenie
              </Link>
            </div>
            <p role="status" aria-live="polite" className="min-h-6 text-base">
              {actionStatus}
            </p>
          </div>

          <PlanDocument
            plan={stage.plan}
            innovation={stage.innovation}
            profile={profile}
            headingRef={headingRef}
          />

          <div className="flex flex-wrap gap-3 border-t border-border pt-6 print:hidden">
            <Button
              type="button"
              variant="outline"
              onClick={() => setStage({ step: "profile" })}
              className={ACTION_CLASSES}
            >
              Zmień opis instytucji
            </Button>
            {!preselected && candidates && (
              <Button
                type="button"
                variant="outline"
                onClick={() => setStage({ step: "candidates" })}
                className={ACTION_CLASSES}
              >
                Wybierz inne rozwiązanie
              </Button>
            )}
          </div>
        </section>
      )}
    </div>
  );
}
