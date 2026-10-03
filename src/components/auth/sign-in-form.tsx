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
  inputClassName,
  labelClassName,
} from "@/components/auth/form-parts";
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
    formState: { errors, isSubmitting },
  } = useForm<SignInValues>({
    resolver: zodResolver(signInSchema),
    defaultValues: { email: "", password: "" },
  });

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

        <div className="flex flex-col gap-2">
          <Label htmlFor="signin-email" className={labelClassName}>
            E-mail
          </Label>
          <Input
            id="signin-email"
            type="email"
            autoComplete="email"
            aria-invalid={errors.email ? true : undefined}
            aria-describedby={errors.email ? "signin-email-error" : undefined}
            className={inputClassName}
            {...register("email")}
          />
          <FieldError id="signin-email-error" message={errors.email?.message} />
        </div>

        <PasswordField
          id="signin-password"
          label="Hasło"
          autoComplete="current-password"
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
