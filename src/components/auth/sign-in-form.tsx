"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { signIn } from "@/app/(auth)/login/actions";
import {
  FieldError,
  FormAlert,
  PasswordField,
  labelClassName,
} from "@/components/auth/form-parts";
import {
  ErrorSummary,
  RequiredFieldsNote,
  RequiredMark,
  errorItems,
  useFocusErrorSummary,
} from "@/components/forms/error-summary";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  type AuthResult,
  type SignInValues,
  signInSchema,
} from "@/lib/auth/schemas";

const NETWORK_ERROR =
  "Nie udało się połączyć z serwerem. Sprawdź połączenie i spróbuj ponownie.";

export function SignInForm({
  next,
  enabled,
}: {
  next: string;
  enabled: boolean;
}) {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting, submitCount },
  } = useForm<SignInValues>({
    resolver: zodResolver(signInSchema),
    defaultValues: { email: "", password: "" },
    mode: "onBlur",
    shouldFocusError: false,
  });
  const summaryErrors = errorItems([
    ["signin-email", errors.email?.message],
    ["signin-password", errors.password?.message],
  ]);
  const summaryRef = useFocusErrorSummary(
    submitCount,
    summaryErrors.length > 0,
  );

  const submit = handleSubmit(async (values) => {
    setServerError(null);
    let result: AuthResult;
    try {
      result = await signIn(values, next);
    } catch {
      result = { ok: false, error: NETWORK_ERROR };
    }
    if (!result.ok) {
      setServerError(result.error);
      return;
    }
    toast.success("Zalogowano.");
    router.replace(result.redirectTo);
    router.refresh();
  });

  return (
    <form onSubmit={submit} noValidate aria-label="Logowanie">
      <fieldset
        disabled={!enabled || isSubmitting}
        className="flex min-w-0 flex-col gap-6"
      >
        <FormAlert message={serverError} />
        {submitCount > 0 && (
          <ErrorSummary ref={summaryRef} errors={summaryErrors} />
        )}
        <RequiredFieldsNote />

        <div className="flex flex-col gap-2">
          <Label htmlFor="signin-email" className={labelClassName}>
            E-mail
            <RequiredMark />
          </Label>
          <Input
            id="signin-email"
            type="email"
            autoComplete="email"
            spellCheck={false}
            aria-required="true"
            aria-invalid={errors.email ? true : undefined}
            aria-describedby={errors.email ? "signin-email-error" : undefined}
            {...register("email")}
          />
          <FieldError id="signin-email-error" message={errors.email?.message} />
        </div>

        <PasswordField
          id="signin-password"
          label="Hasło"
          autoComplete="current-password"
          required
          error={errors.password?.message}
          registration={register("password")}
        />

        <div>
          <Button type="submit" size="lg" className="w-full sm:w-auto">
            {isSubmitting ? "Loguję…" : "Zaloguj się"}
          </Button>
          <p role="status" className="sr-only">
            {isSubmitting ? "Loguję…" : ""}
          </p>
        </div>
      </fieldset>
    </form>
  );
}
