"use client";

import {
  CheckCircleIcon,
  ExclamationCircleIcon,
  InformationCircleIcon,
} from "@heroicons/react/20/solid";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { signUpForTest } from "@/app/(public)/test/actions";
import {
  ChoiceGroup,
  FieldError,
  TextField,
} from "@/components/testing/fields";
import { Button } from "@/components/ui/button";
import { addLocalSignup } from "@/lib/testing/local-store";
import {
  AVAILABILITY_OPTIONS,
  SIGNUP_FORM_DEFAULTS,
  SIGNUP_MESSAGES,
  type SignupFormInput,
  type SignupFormValues,
  signupFormSchema,
} from "@/lib/testing/schemas";

export type TestingMode = "demo" | "signed-in" | "signed-out";

export const DEMO_NOTE =
  "Tryb demonstracyjny: zapisujemy dane tylko w tej przeglądarce.";

type Status =
  | { kind: "idle" }
  | { kind: "submitting" }
  | { kind: "success" }
  | { kind: "error"; message: string };

function Notice({
  tone,
  children,
}: {
  tone: "info" | "success";
  children: React.ReactNode;
}) {
  const Icon = tone === "success" ? CheckCircleIcon : InformationCircleIcon;
  return (
    <p className="flex items-start gap-2 text-base font-medium">
      <Icon
        aria-hidden="true"
        className={
          tone === "success"
            ? "mt-0.5 size-5 shrink-0 text-success"
            : "mt-0.5 size-5 shrink-0 text-primary"
        }
      />
      <span>{children}</span>
    </p>
  );
}

export function SignupForm({
  testId,
  testTitle,
  slotsLeft,
  alreadySignedUp,
  mode,
  loginHref,
}: {
  testId: string;
  testTitle: string;
  /** Slots still free, not counting a sign-up made in this session. */
  slotsLeft: number;
  /** The user (or, in demo mode, this browser) is already signed up. */
  alreadySignedUp: boolean;
  mode: TestingMode;
  loginHref: string;
}) {
  const [status, setStatus] = useState<Status>({ kind: "idle" });
  const messageRef = useRef<HTMLDivElement>(null);
  const {
    register,
    handleSubmit,
    getValues,
    control,
    formState: { errors },
  } = useForm<SignupFormInput, unknown, SignupFormValues>({
    resolver: zodResolver(signupFormSchema),
    defaultValues: SIGNUP_FORM_DEFAULTS,
  });

  // The form is replaced by the message, so focus has to follow it.
  useEffect(() => {
    if (status.kind === "success" || status.kind === "error") {
      messageRef.current?.focus();
    }
  }, [status]);

  if (status.kind === "success") {
    return (
      <div ref={messageRef} tabIndex={-1} role="status" className="rounded-sm">
        <Notice tone="success">{SIGNUP_MESSAGES.success}</Notice>
      </div>
    );
  }
  if (mode === "signed-out") {
    return (
      <p className="text-base">
        <Link
          href={loginHref}
          className="inline-flex min-h-11 items-center rounded-sm font-medium text-primary underline underline-offset-4 hover:decoration-2"
        >
          {SIGNUP_MESSAGES.signedOut}
        </Link>
      </p>
    );
  }
  if (alreadySignedUp) {
    return (
      <div className="flex flex-col gap-2">
        <Notice tone="success">{SIGNUP_MESSAGES.signedUp}</Notice>
        {mode === "signed-in" && (
          <p className="text-base">
            {SIGNUP_MESSAGES.cancelHint}{" "}
            <Link
              href={`/messages/new?kind=ask_rops&subject=${encodeURIComponent(`Rezygnacja z testu: ${testTitle}`)}`}
              className="inline-flex min-h-11 items-center rounded-sm font-medium text-primary underline underline-offset-4 hover:decoration-2"
            >
              Napisz do zespołu ROPS
            </Link>
          </p>
        )}
      </div>
    );
  }
  if (slotsLeft <= 0) {
    return <Notice tone="info">{SIGNUP_MESSAGES.full}</Notice>;
  }

  async function submit() {
    if (status.kind === "submitting") return;
    if (mode === "demo") {
      addLocalSignup(testId);
      setStatus({ kind: "success" });
      return;
    }
    setStatus({ kind: "submitting" });
    try {
      // The action validates the raw values again on the server.
      const result = await signUpForTest(testId, getValues());
      setStatus(
        result.ok
          ? { kind: "success" }
          : { kind: "error", message: result.message },
      );
    } catch {
      setStatus({ kind: "error", message: SIGNUP_MESSAGES.failed });
    }
  }

  const fieldId = (name: string) => `signup-${testId}-${name}`;
  const submitting = status.kind === "submitting";

  return (
    <form
      onSubmit={handleSubmit(submit)}
      noValidate
      aria-label={`Zgłoszenie do testu: ${testTitle}`}
      className="flex flex-col gap-6"
    >
      {status.kind === "error" && (
        <div
          ref={messageRef}
          tabIndex={-1}
          role="alert"
          className="flex items-start gap-2 rounded-md border-2 border-destructive p-4 text-base font-medium"
        >
          <ExclamationCircleIcon
            aria-hidden="true"
            className="mt-0.5 size-5 shrink-0 text-destructive"
          />
          {status.message}
        </div>
      )}

      <ChoiceGroup
        legend="Kiedy możesz?"
        options={AVAILABILITY_OPTIONS}
        registration={register("availability")}
        error={errors.availability?.message}
      />

      <TextField
        id={fieldId("motivation")}
        label="Dlaczego chcesz przetestować? (opcjonalnie)"
        control={control}
        name="motivation"
        registration={register("motivation")}
        error={errors.motivation?.message}
      />

      <TextField
        id={fieldId("accessibility")}
        label="Czy potrzebujesz udogodnień? (opcjonalnie)"
        hint="Na przykład tłumacza języka migowego, podjazdu albo materiałów dużą czcionką."
        control={control}
        name="accessibilityNeeds"
        registration={register("accessibilityNeeds")}
        error={errors.accessibilityNeeds?.message}
      />

      <div className="flex flex-col gap-1">
        <label className="flex min-h-11 cursor-pointer items-center gap-3 text-base">
          <input
            type="checkbox"
            aria-invalid={errors.consent ? true : undefined}
            aria-describedby={
              errors.consent ? fieldId("consent-error") : undefined
            }
            className="size-5 shrink-0 accent-primary"
            {...register("consent")}
          />
          Zgadzam się na kontakt w sprawie testu.
        </label>
        <FieldError
          id={fieldId("consent-error")}
          message={errors.consent?.message}
        />
      </div>

      <div className="flex flex-col items-start gap-2">
        <Button
          type="submit"
          aria-disabled={submitting || undefined}
          className="h-auto min-h-12 px-6 py-3 text-lg font-semibold"
        >
          {submitting ? "Wysyłam…" : "Zgłoś się"}
          <span className="sr-only">: {testTitle}</span>
        </Button>
        {mode === "demo" && (
          <p className="text-sm text-muted-foreground">{DEMO_NOTE}</p>
        )}
      </div>
    </form>
  );
}
