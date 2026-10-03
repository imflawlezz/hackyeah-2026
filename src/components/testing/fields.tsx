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
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { TEXT_MAX_LENGTH } from "@/lib/testing/schemas";
import { cn } from "@/lib/utils";

export function FieldError({ id, message }: { id: string; message?: string }) {
  if (!message) return null;
  return (
    <p
      id={id}
      role="alert"
      className="flex items-start gap-1.5 text-base font-medium text-destructive"
    >
      <ExclamationCircleIcon
        aria-hidden="true"
        className="mt-0.5 size-5 shrink-0"
      />
      {message}
    </p>
  );
}

/** A native radio group in a fieldset: arrow keys, one tab stop, text labels. */
export function ChoiceGroup({
  legend,
  hint,
  options,
  registration,
  error,
  className,
}: {
  legend: ReactNode;
  hint?: string;
  options: readonly { value: string | number; label: string }[];
  registration: UseFormRegisterReturn;
  error?: string;
  className?: string;
}) {
  const { name } = registration;
  const hintId = `${name}-hint`;
  const errorId = `${name}-error`;
  const describedBy = cn(hint && hintId, error && errorId) || undefined;

  return (
    <fieldset
      aria-describedby={describedBy}
      className={cn("flex flex-col gap-1", className)}
    >
      <legend className="mb-1 text-lg font-semibold">{legend}</legend>
      {hint && (
        <p id={hintId} className="text-base text-muted-foreground">
          {hint}
        </p>
      )}
      <div className="flex flex-col">
        {options.map((option) => (
          <label
            key={option.value}
            className="flex min-h-11 cursor-pointer items-center gap-3 text-base"
          >
            <input
              type="radio"
              value={String(option.value)}
              aria-describedby={error ? errorId : undefined}
              className="size-5 shrink-0 accent-primary"
              {...registration}
            />
            {option.label}
          </label>
        ))}
      </div>
      <FieldError id={errorId} message={error} />
    </fieldset>
  );
}

/** An optional textarea with a visible label and a live character count. */
export function TextField<TValues extends FieldValues, TOutput>({
  id,
  label,
  hint,
  control,
  name,
  registration,
  error,
  rows = 3,
}: {
  id: string;
  label: string;
  hint?: string;
  control: Control<TValues, unknown, TOutput>;
  name: FieldPath<TValues>;
  registration: UseFormRegisterReturn;
  error?: string;
  rows?: number;
}) {
  const value: unknown = useWatch({ control, name });
  const length = typeof value === "string" ? value.length : 0;
  const overLimit = length > TEXT_MAX_LENGTH;
  const hintId = `${id}-hint`;
  const errorId = `${id}-error`;
  const countId = `${id}-count`;

  return (
    <div className="flex flex-col gap-2">
      <Label htmlFor={id} className="text-lg leading-snug font-semibold">
        {label}
      </Label>
      {hint && (
        <p id={hintId} className="text-base text-muted-foreground">
          {hint}
        </p>
      )}
      <Textarea
        id={id}
        rows={rows}
        aria-invalid={error ? true : undefined}
        aria-describedby={cn(hint && hintId, error && errorId, countId)}
        className="field-sizing-fixed min-h-24 resize-y rounded-md bg-background px-3 py-2 text-base md:text-base"
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
          {length} / {TEXT_MAX_LENGTH}
          <span className="sr-only"> znaków</span>
        </p>
      </div>
    </div>
  );
}
