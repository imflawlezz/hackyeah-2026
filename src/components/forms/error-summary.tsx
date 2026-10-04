"use client";

import { ExclamationCircleIcon } from "@heroicons/react/20/solid";
import { forwardRef, useEffect, useRef } from "react";

export type FormErrorItem = { fieldId: string; message: string };

/** Field ids paired with their error messages, in form order; empty ones dropped. */
export function errorItems(
  pairs: [fieldId: string, message: string | undefined][],
): FormErrorItem[] {
  return pairs.flatMap(([fieldId, message]) =>
    message ? [{ fieldId, message }] : [],
  );
}

/**
 * Gov.pl error summary: shown after a failed submit at the top of the form,
 * receives focus, and links each error to its field.
 */
export const ErrorSummary = forwardRef<
  HTMLDivElement,
  { errors: FormErrorItem[]; title?: string }
>(function ErrorSummary({ errors, title = "Popraw błędy w formularzu" }, ref) {
  if (!errors.length) return null;
  return (
    <div
      ref={ref}
      role="alert"
      tabIndex={-1}
      className="flex flex-col gap-2 border-l-4 border-destructive bg-background p-4 outline-offset-2"
    >
      <p className="flex items-center gap-2 font-bold text-destructive">
        <ExclamationCircleIcon aria-hidden="true" className="size-5 shrink-0" />
        {title}
      </p>
      <ul className="flex list-disc flex-col gap-1 pl-6">
        {errors.map((error) => (
          <li key={error.fieldId}>
            <a
              href={`#${error.fieldId}`}
              className="text-destructive underline underline-offset-4 hover:no-underline"
              onClick={(event) => {
                const field = document.getElementById(error.fieldId);
                if (!field) return;
                event.preventDefault();
                field.focus();
                field.scrollIntoView({ block: "center" });
              }}
            >
              {error.message}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
});

/** Moves focus to the summary each time `trigger` changes and errors exist. */
export function useFocusErrorSummary(trigger: number, hasErrors: boolean) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (trigger > 0 && hasErrors) ref.current?.focus();
  }, [trigger, hasErrors]);
  return ref;
}

/** "* pole wymagane", placed under the form title. */
export function RequiredFieldsNote() {
  return (
    <p className="text-foreground">
      <span aria-hidden="true" className="text-destructive">
        *
      </span>{" "}
      pole wymagane
    </p>
  );
}

/** The visible asterisk after a required field's label. Hidden from AT. */
export function RequiredMark() {
  return (
    <span aria-hidden="true" className="text-destructive">
      {" *"}
    </span>
  );
}
