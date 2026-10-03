"use client";

import { useEffect, useRef, useState } from "react";
import {
  ExclamationCircleIcon,
  EyeIcon,
  EyeSlashIcon,
} from "@heroicons/react/24/outline";
import type { UseFormRegisterReturn } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

export const labelClassName = "text-base leading-snug font-semibold";
export const inputClassName = "text-base md:text-base";

export function FieldError({ id, message }: { id: string; message?: string }) {
  if (!message) return null;
  return (
    <p
      id={id}
      className="flex items-start gap-1.5 font-medium text-destructive"
    >
      <ExclamationCircleIcon
        aria-hidden="true"
        className="mt-0.5 size-6 shrink-0"
      />
      {message}
    </p>
  );
}

/** Server-side error summary. Receives focus so screen readers land on it. */
export function FormAlert({ message }: { message: string | null }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (message) ref.current?.focus();
  }, [message]);

  if (!message) return null;
  return (
    <div
      ref={ref}
      role="alert"
      tabIndex={-1}
      className="flex items-start gap-2 rounded-md border border-destructive bg-background p-4 font-medium text-destructive"
    >
      <ExclamationCircleIcon
        aria-hidden="true"
        className="mt-0.5 size-6 shrink-0"
      />
      <p>{message}</p>
    </div>
  );
}

export function PasswordField({
  id,
  label,
  hint,
  error,
  autoComplete,
  registration,
}: {
  id: string;
  label: string;
  hint?: string;
  error?: string;
  autoComplete: "current-password" | "new-password";
  registration: UseFormRegisterReturn;
}) {
  const [visible, setVisible] = useState(false);
  const Icon = visible ? EyeSlashIcon : EyeIcon;

  return (
    <div className="flex flex-col gap-2">
      <Label htmlFor={id} className={labelClassName}>
        {label}
      </Label>
      {hint ? (
        <p id={`${id}-hint`} className="text-muted-foreground">
          {hint}
        </p>
      ) : null}
      <div className="relative">
        <Input
          id={id}
          type={visible ? "text" : "password"}
          autoComplete={autoComplete}
          aria-invalid={error ? true : undefined}
          aria-describedby={
            cn(hint && `${id}-hint`, error && `${id}-error`) || undefined
          }
          className={cn(inputClassName, "pr-12")}
          {...registration}
        />
        <button
          type="button"
          aria-label="Pokaż hasło"
          aria-pressed={visible}
          onClick={() => setVisible((current) => !current)}
          className="absolute inset-y-0 right-0 flex w-11 items-center justify-center rounded-lg text-muted-foreground hover:text-foreground disabled:pointer-events-none disabled:opacity-50"
        >
          <Icon aria-hidden="true" className="size-6" />
        </button>
      </div>
      <FieldError id={`${id}-error`} message={error} />
    </div>
  );
}
