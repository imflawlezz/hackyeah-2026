"use client";

import { ExclamationCircleIcon } from "@heroicons/react/20/solid";
import type { ReactNode } from "react";
import {
  type Control,
  type FieldPath,
  type FieldValues,
  type UseFormRegisterReturn,
  useWatch,
} from "react-hook-form";
import { RequiredMark } from "@/components/forms/error-summary";
import { Label } from "@/components/ui/label";
import { Radio } from "@/components/ui/radio";
import { Textarea } from "@/components/ui/textarea";
import { TEXT_MAX_LENGTH } from "@/lib/testing/schemas";
import { cn } from "@/lib/utils";

export function FieldError({ id, message }: { id: string; message?: string }) {
  if (!message) return null;
  return (
    <p
      id={id}
      role="alert"
      className="flex items-start gap-2 text-base font-semibold text-destructive"
    >
      <ExclamationCircleIcon
        aria-hidden="true"
        className="mt-0.5 size-5 shrink-0"
      />
      {message}
    </p>
  );
}

/** Id of one radio option; the error summary links to the first option. */
export function choiceId(name: string, value: string | number): string {
  return `${name}-${String(value)}`;
}

/** A native radio group in a fieldset: arrow keys, one tab stop, text labels. */
export function ChoiceGroup({
  legend,
  hint,
  options,
  registration,
  error,
  className,
  required = false,
  idPrefix,
}: {
  legend: ReactNode;
  hint?: string;
  options: readonly { value: string | number; label: string }[];
  registration: UseFormRegisterReturn;
  error?: string;
  className?: string;
  required?: boolean;
  /** Needed when the same form appears more than once on a page. */
  idPrefix?: string;
}) {
  const prefix = idPrefix ?? registration.name;
  const hintId = `${prefix}-hint`;
  const errorId = `${prefix}-error`;
  const describedBy = cn(hint && hintId, error && errorId) || undefined;

  return (
    <fieldset
      aria-describedby={describedBy}
      className={cn("flex flex-col gap-1", className)}
    >
      <legend className="mb-1 text-lg font-semibold">
        {legend}
        {required && <RequiredMark />}
      </legend>
      {hint && (
        <p id={hintId} className="text-base text-muted-foreground">
          {hint}
        </p>
      )}
      <div className="flex flex-col">
        {options.map((option) => (
          <label
            key={option.value}
            className="flex min-h-11 cursor-pointer items-center gap-2.5 text-base"
          >
            <Radio
              id={choiceId(prefix, option.value)}
              value={String(option.value)}
              aria-invalid={error ? true : undefined}
              aria-describedby={error ? errorId : undefined}
              {...registration}
              required={required}
            />
            {option.label}
          </label>
        ))}
      </div>
      <FieldError id={errorId} message={error} />
    </fieldset>
  );
}

/** A textarea with a visible label and a live character count. */
export function TextField<TValues extends FieldValues, TOutput>({
  id,
  label,
  hint,
  control,
  name,
  registration,
  error,
  rows = 3,
  maxLength = TEXT_MAX_LENGTH,
  required = false,
}: {
  required?: boolean;
  id: string;
  label: string;
  hint?: string;
  control: Control<TValues, unknown, TOutput>;
  name: FieldPath<TValues>;
  registration: UseFormRegisterReturn;
  error?: string;
  rows?: number;
  /** The limit shown in the counter; validation itself lives in the schema. */
  maxLength?: number;
}) {
  const value: unknown = useWatch({ control, name });
  const length = typeof value === "string" ? value.length : 0;
  const overLimit = length > maxLength;
  const hintId = `${id}-hint`;
  const errorId = `${id}-error`;
  const countId = `${id}-count`;

  return (
    <div className="flex flex-col gap-2">
      <Label htmlFor={id} className="text-lg leading-snug font-semibold">
        {label}
        {required && <RequiredMark />}
      </Label>
      {hint && (
        <p id={hintId} className="text-base text-muted-foreground">
          {hint}
        </p>
      )}
      <Textarea
        id={id}
        rows={rows}
        aria-required={required || undefined}
        aria-invalid={error ? true : undefined}
        aria-describedby={cn(hint && hintId, error && errorId, countId)}
        className="field-sizing-fixed min-h-24 resize-y"
        {...registration}
      />
      <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-1">
        <FieldError id={errorId} message={error} />
        <p
          id={countId}
          className={cn(
            "ml-auto text-sm tabular-nums",
            overLimit
              ? "font-semibold text-destructive"
              : "text-muted-foreground",
          )}
        >
          {length} / {maxLength}
          <span className="sr-only"> znaków</span>
        </p>
      </div>
    </div>
  );
}
