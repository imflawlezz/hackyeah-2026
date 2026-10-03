"use client";

import {
  CheckCircleIcon,
  ExclamationCircleIcon,
} from "@heroicons/react/20/solid";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { submitFeedback } from "@/app/(public)/test/actions";
import { ChoiceGroup, TextField } from "@/components/testing/fields";
import { DEMO_NOTE, type TestingMode } from "@/components/testing/signup-form";
import { Button } from "@/components/ui/button";
import { addLocalFeedback } from "@/lib/testing/local-store";
import {
  EASE_OPTIONS,
  FEEDBACK_FORM_DEFAULTS,
  FEEDBACK_MESSAGES,
  type FeedbackFormInput,
  type FeedbackFormValues,
  feedbackFormSchema,
  RATING_OPTIONS,
  RECOMMEND_OPTIONS,
} from "@/lib/testing/schemas";
import type { FeedbackSummary } from "@/types";

type Status =
  | { kind: "idle" }
  | { kind: "submitting" }
  | { kind: "success" }
  | { kind: "error"; message: string };

export function FeedbackForm({
  innovationId,
  testId,
  mode,
  loginHref,
  onSummary,
}: {
  innovationId: string;
  /** The test this opinion is attached to, when the innovation has one. */
  testId?: string;
  mode: TestingMode;
  loginHref: string;
  /** Called with the refreshed summary after a server submit. */
  onSummary?: (summary: FeedbackSummary) => void;
}) {
  const [status, setStatus] = useState<Status>({ kind: "idle" });
  const messageRef = useRef<HTMLDivElement>(null);
  const {
    register,
    handleSubmit,
    getValues,
    reset,
    control,
    formState: { errors },
  } = useForm<FeedbackFormInput, unknown, FeedbackFormValues>({
    resolver: zodResolver(feedbackFormSchema),
    defaultValues: { ...FEEDBACK_FORM_DEFAULTS, testId: testId ?? "" },
  });

  useEffect(() => {
    if (status.kind === "success" || status.kind === "error") {
      messageRef.current?.focus();
    }
  }, [status]);

  if (mode === "signed-out") {
    return (
      <p className="text-base">
        <Link
          href={loginHref}
          className="inline-flex min-h-11 items-center rounded-sm text-primary underline underline-offset-4 hover:decoration-2"
        >
          {FEEDBACK_MESSAGES.signedOut}
        </Link>
      </p>
    );
  }

  async function submit(values: FeedbackFormValues) {
    if (status.kind === "submitting") return;
    if (mode === "demo") {
      addLocalFeedback({
        innovationId,
        rating: values.rating,
        easeOfUse: values.easeOfUse,
        wouldRecommend: values.wouldRecommend,
      });
      reset();
      setStatus({ kind: "success" });
      return;
    }
    setStatus({ kind: "submitting" });
    try {
      const result = await submitFeedback(innovationId, getValues());
      if (result.ok) {
        onSummary?.(result.summary);
        reset();
        setStatus({ kind: "success" });
      } else {
        setStatus({ kind: "error", message: result.message });
      }
    } catch {
      setStatus({ kind: "error", message: FEEDBACK_MESSAGES.failed });
    }
  }

  const submitting = status.kind === "submitting";

  return (
    <form
      onSubmit={handleSubmit(submit)}
      noValidate
      aria-label="Twoja opinia"
      className="flex flex-col gap-8"
    >
      {status.kind === "success" && (
        <div
          ref={messageRef}
          tabIndex={-1}
          role="status"
          className="flex items-start gap-2 rounded-md border border-success p-4 text-base font-semibold"
        >
          <CheckCircleIcon
            aria-hidden="true"
            className="mt-0.5 size-5 shrink-0 text-success"
          />
          {FEEDBACK_MESSAGES.success}
        </div>
      )}
      {status.kind === "error" && (
        <div
          ref={messageRef}
          tabIndex={-1}
          role="alert"
          className="flex items-start gap-2 rounded-md border-2 border-destructive p-4 text-base font-semibold"
        >
          <ExclamationCircleIcon
            aria-hidden="true"
            className="mt-0.5 size-5 shrink-0 text-destructive"
          />
          {status.message}
        </div>
      )}

      <ChoiceGroup
        legend="Jak oceniasz to rozwiązanie?"
        options={RATING_OPTIONS}
        registration={register("rating")}
        error={errors.rating?.message}
      />

      <ChoiceGroup
        legend="Na ile było proste w użyciu? (opcjonalnie)"
        options={EASE_OPTIONS}
        registration={register("easeOfUse")}
        error={errors.easeOfUse?.message}
      />

      <ChoiceGroup
        legend="Czy polecisz je innym? (opcjonalnie)"
        options={RECOMMEND_OPTIONS}
        registration={register("wouldRecommend")}
        error={errors.wouldRecommend?.message}
      />

      <TextField
        id="feedback-what-worked"
        label="Co zadziałało? (opcjonalnie)"
        control={control}
        name="whatWorked"
        registration={register("whatWorked")}
        error={errors.whatWorked?.message}
      />

      <TextField
        id="feedback-what-to-improve"
        label="Co trzeba poprawić? (opcjonalnie)"
        control={control}
        name="whatToImprove"
        registration={register("whatToImprove")}
        error={errors.whatToImprove?.message}
      />

      <TextField
        id="feedback-comment"
        label="Chcesz coś dodać? (opcjonalnie)"
        hint="Komentarze czyta tylko zespół ROPS. Publicznie pokazujemy same liczby."
        control={control}
        name="comment"
        registration={register("comment")}
        error={errors.comment?.message}
      />

      <div className="flex flex-col items-start gap-2">
        <Button
          type="submit"
          aria-disabled={submitting || undefined}
          className="h-auto min-h-12 px-6 py-3 text-lg font-semibold"
        >
          {submitting ? "Wysyłam…" : "Wyślij opinię"}
        </Button>
        {mode === "demo" && (
          <p className="text-sm text-muted-foreground">{DEMO_NOTE}</p>
        )}
      </div>
    </form>
  );
}
