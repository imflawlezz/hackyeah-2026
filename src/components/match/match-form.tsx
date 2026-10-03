"use client";

import { VoiceFieldInput } from "@/components/voice/voice-field-input";
import { zodResolver } from "@hookform/resolvers/zod";
import { ExclamationCircleIcon } from "@heroicons/react/20/solid";
import { useForm, useWatch } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  ErrorSummary,
  RequiredFieldsNote,
  RequiredMark,
  useFocusErrorSummary,
  type FormErrorItem,
} from "@/components/forms/error-summary";
import { cn } from "@/lib/utils";
import { innovations, problems } from "@/lib/mocks";

export const PROBLEM_MIN_LENGTH = 10;
export const PROBLEM_MAX_LENGTH = 2000;

export const matchFormSchema = z.object({
  problem: z
    .string()
    .trim()
    .min(
      PROBLEM_MIN_LENGTH,
      "Opis jest za krótki. Napisz co najmniej 10 znaków.",
    )
    .max(PROBLEM_MAX_LENGTH, "Opis może mieć maksymalnie 2000 znaków."),
  category: z.string(),
});

export type MatchFormValues = z.infer<typeof matchFormSchema>;

export const CATEGORIES = [
  ...new Set(innovations.map((innovation) => innovation.category)),
].sort((left, right) => left.localeCompare(right, "pl"));

const EXAMPLE_LABELS: Record<string, string> = {
  "prob-rural-seniors": "Samotni seniorzy na wsi",
  "prob-after-school": "Młodzież po lekcjach",
  "prob-office-access": "Niedostępny urząd",
};

const EXAMPLES = problems.slice(0, 4).map((problem) => ({
  id: problem.id,
  label: EXAMPLE_LABELS[problem.id] ?? problem.description.slice(0, 32),
  description: problem.description,
}));

const FIELD_CLASSES =
  "w-full rounded-lg border border-input bg-background text-foreground outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20";

export function MatchForm({
  signedIn = false,
  defaultValues,
  loading,
  onSearch,
  onInvalid,
}: {
  signedIn?: boolean;
  defaultValues: MatchFormValues;
  loading: boolean;
  onSearch: (values: MatchFormValues) => void;
  onInvalid?: () => void;
}) {
  const {
    register,
    getValues,
    handleSubmit,
    setValue,
    setFocus,
    control,
    formState: { errors, isSubmitted, submitCount },
  } = useForm<MatchFormValues>({
    resolver: zodResolver(matchFormSchema),
    defaultValues,
    mode: "onBlur",
    // Focus goes to the error summary instead (Gov.pl forms).
    shouldFocusError: false,
  });

  const problemLength = useWatch({ control, name: "problem" })?.length ?? 0;
  const problemError = errors.problem?.message;
  const overLimit = problemLength > PROBLEM_MAX_LENGTH;
  const summaryErrors: FormErrorItem[] = problemError
    ? [{ fieldId: "problem", message: problemError }]
    : [];
  const summaryRef = useFocusErrorSummary(
    submitCount,
    summaryErrors.length > 0,
  );

  const submit = handleSubmit(
    (values) => {
      if (!loading) {
        onSearch(values);
      }
    },
    () => onInvalid?.(),
  );

  function fillExample(description: string) {
    setValue("problem", description, {
      shouldDirty: true,
      shouldValidate: isSubmitted,
    });
    setFocus("problem");
  }

  return (
    <form
      onSubmit={submit}
      noValidate
      aria-label="Wyszukiwanie innowacji"
      className="flex min-w-0 flex-col gap-6"
    >
      {submitCount > 0 && (
        <ErrorSummary ref={summaryRef} errors={summaryErrors} />
      )}
      <RequiredFieldsNote />
      <div className="flex flex-col gap-2">
        <Label htmlFor="problem" className="text-lg font-semibold">
          Opis problemu
          <RequiredMark />
        </Label>
        <p id="problem-hint" className="text-base text-muted-foreground">
          Napisz, kogo dotyczy problem, gdzie występuje i czego brakuje.
        </p>
        <Textarea
          autoComplete="off"
          id="problem"
          rows={6}
          aria-required="true"
          aria-invalid={problemError ? true : undefined}
          aria-describedby={cn(
            "problem-hint",
            problemError && "problem-error",
            "problem-count",
          )}
          className={cn(
            FIELD_CLASSES,
            "field-sizing-fixed min-h-40 resize-y px-4 py-2.5 text-lg leading-relaxed md:text-lg",
          )}
          {...register("problem")}
        />
        <VoiceFieldInput
          getValue={() => getValues("problem")}
          onChange={(value) =>
            setValue("problem", value, {
              shouldDirty: true,
              shouldValidate: isSubmitted,
            })
          }
          limit={PROBLEM_MAX_LENGTH}
          disabled={loading || !signedIn}
        />
        {!signedIn && (
          <p className="text-sm text-muted-foreground">
            <a href="/login?next=%2Fmatch" className="underline">
              Zaloguj się
            </a>
            , aby korzystać z wprowadzania głosowego.
          </p>
        )}
        <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-1">
          {problemError ? (
            <p
              id="problem-error"
              className="flex items-center gap-2 font-semibold text-destructive"
            >
              <ExclamationCircleIcon
                aria-hidden="true"
                className="size-5 shrink-0"
              />
              {problemError}
            </p>
          ) : (
            <span />
          )}
          <p
            id="problem-count"
            className={cn(
              "ml-auto text-sm tabular-nums",
              overLimit
                ? "font-semibold text-destructive"
                : "text-muted-foreground",
            )}
          >
            {problemLength} / {PROBLEM_MAX_LENGTH}
            <span className="sr-only"> znaków</span>
          </p>
        </div>
      </div>

      <section
        aria-labelledby="examples-heading"
        className="flex flex-col gap-2.5"
      >
        <h2 id="examples-heading" className="text-base font-semibold">
          Przykłady
        </h2>
        <ul className="flex flex-wrap gap-2">
          {EXAMPLES.map((example) => (
            <li key={example.id}>
              <button
                type="button"
                onClick={() => fillExample(example.description)}
                className="min-h-11 rounded-md border border-input bg-background px-4 py-2 text-base text-foreground transition-colors outline-none hover:bg-muted focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
              >
                <span className="sr-only">Wstaw przykład: </span>
                {example.label}
              </button>
            </li>
          ))}
        </ul>
      </section>

      <div className="flex flex-col gap-2 sm:max-w-sm">
        <Label htmlFor="category" className="text-lg font-semibold">
          Kategoria
        </Label>
        <select
          id="category"
          className={cn(
            FIELD_CLASSES,
            "min-h-12 max-w-full min-w-0 px-2.5 text-lg",
          )}
          {...register("category")}
        >
          <option value="">Wszystkie kategorie</option>
          {CATEGORIES.map((category) => (
            <option key={category} value={category}>
              {category}
            </option>
          ))}
        </select>
      </div>

      <div>
        <Button
          type="submit"
          aria-disabled={loading || undefined}
          className={cn(
            "h-auto min-h-12 w-full gap-2 px-6 py-2.5 text-lg font-semibold whitespace-normal sm:w-auto [&_svg:not([class*='size-'])]:size-5",
            loading && "cursor-progress",
          )}
        >
          {loading ? "Wyszukujemy rozwiązania…" : "Znajdź rozwiązania"}
        </Button>
      </div>
    </form>
  );
}
