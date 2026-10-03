"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { signUp } from "@/app/(auth)/login/actions";
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
import { ROLE_LABELS, SIGNUP_ROLES, type SignupRole } from "@/lib/auth/roles";
import {
  type AuthResult,
  type SignUpValues,
  signUpSchema,
} from "@/lib/auth/schemas";

const ROLE_DESCRIPTIONS: Record<SignupRole, string> = {
  resident: "Mieszkasz w Małopolsce albo działasz w organizacji pozarządowej.",
  jst: "Pracujesz w urzędzie gminy, powiatu lub w jednostce pomocy społecznej.",
  expert: "Doradzasz przy innowacjach społecznych albo je oceniasz.",
};

const NETWORK_ERROR =
  "Nie udało się połączyć z serwerem. Sprawdź połączenie i spróbuj ponownie.";

export function SignUpForm({
  next,
  enabled,
}: {
  next: string;
  enabled: boolean;
}) {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);
  const [confirmationSent, setConfirmationSent] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SignUpValues>({
    resolver: zodResolver(signUpSchema),
    defaultValues: {
      displayName: "",
      email: "",
      password: "",
      role: "resident",
      municipality: "",
    },
  });

  const submit = handleSubmit(async (values) => {
    setServerError(null);
    let result: AuthResult;
    try {
      result = await signUp(values, next);
    } catch {
      result = { ok: false, error: NETWORK_ERROR };
    }
    if (!result.ok) {
      setServerError(result.error);
      return;
    }
    toast.success("Konto zostało założone.");
    if (result.needsConfirmation) {
      toast.info("Sprawdź skrzynkę i potwierdź adres e-mail.");
      setConfirmationSent(true);
      return;
    }
    router.replace(result.redirectTo);
    router.refresh();
  });

  if (confirmationSent) {
    return (
      <div role="status" className="flex flex-col gap-2">
        <h2 className="text-xl font-bold">Konto zostało założone</h2>
        <p>
          Sprawdź skrzynkę i potwierdź adres e-mail. Po kliknięciu linku z
          wiadomości zalogujemy Cię automatycznie.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={submit} noValidate aria-label="Zakładanie konta">
      <fieldset
        disabled={!enabled || isSubmitting}
        className="flex min-w-0 flex-col gap-6"
      >
        <FormAlert message={serverError} />

        <div className="flex flex-col gap-2">
          <Label htmlFor="signup-name" className={labelClassName}>
            Imię lub nazwa wyświetlana
          </Label>
          <p id="signup-name-hint" className="text-muted-foreground">
            Tak podpiszemy Twoje pomysły i wiadomości.
          </p>
          <Input
            id="signup-name"
            type="text"
            autoComplete="nickname"
            aria-invalid={errors.displayName ? true : undefined}
            aria-describedby={
              errors.displayName
                ? "signup-name-hint signup-name-error"
                : "signup-name-hint"
            }
            className={inputClassName}
            {...register("displayName")}
          />
          <FieldError
            id="signup-name-error"
            message={errors.displayName?.message}
          />
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="signup-email" className={labelClassName}>
            E-mail
          </Label>
          <Input
            id="signup-email"
            type="email"
            autoComplete="email"
            aria-invalid={errors.email ? true : undefined}
            aria-describedby={errors.email ? "signup-email-error" : undefined}
            className={inputClassName}
            {...register("email")}
          />
          <FieldError id="signup-email-error" message={errors.email?.message} />
        </div>

        <PasswordField
          id="signup-password"
          label="Hasło"
          hint="Co najmniej 8 znaków."
          autoComplete="new-password"
          error={errors.password?.message}
          registration={register("password")}
        />

        <fieldset
          aria-describedby={errors.role ? "signup-role-error" : undefined}
          className="flex min-w-0 flex-col gap-2"
        >
          <legend className={`${labelClassName} mb-2`}>Kim jesteś?</legend>
          {SIGNUP_ROLES.map((role) => (
            <label
              key={role}
              htmlFor={`signup-role-${role}`}
              className="flex min-h-11 cursor-pointer items-start gap-3 rounded-md border border-input p-3 has-checked:border-primary has-checked:bg-accent has-disabled:cursor-not-allowed has-disabled:opacity-50"
            >
              <input
                id={`signup-role-${role}`}
                type="radio"
                value={role}
                className="mt-1 size-5 shrink-0 accent-primary"
                {...register("role")}
              />
              <span className="flex flex-col">
                <span className="font-semibold">{ROLE_LABELS[role]}</span>
                <span className="text-muted-foreground">
                  {ROLE_DESCRIPTIONS[role]}
                </span>
              </span>
            </label>
          ))}
          <FieldError id="signup-role-error" message={errors.role?.message} />
        </fieldset>

        <div className="flex flex-col gap-2">
          <Label htmlFor="signup-municipality" className={labelClassName}>
            Gmina (opcjonalnie)
          </Label>
          <Input
            id="signup-municipality"
            type="text"
            autoComplete="address-level2"
            aria-invalid={errors.municipality ? true : undefined}
            aria-describedby={
              errors.municipality ? "signup-municipality-error" : undefined
            }
            className={inputClassName}
            {...register("municipality")}
          />
          <FieldError
            id="signup-municipality-error"
            message={errors.municipality?.message}
          />
        </div>

        <div>
          <Button type="submit" size="lg" className="w-full sm:w-auto">
            {isSubmitting ? "Zakładam konto…" : "Załóż konto"}
          </Button>
          <p role="status" className="sr-only">
            {isSubmitting ? "Zakładam konto…" : ""}
          </p>
        </div>
      </fieldset>
    </form>
  );
}
