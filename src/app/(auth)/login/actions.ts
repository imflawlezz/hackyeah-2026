"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import type { AuthError } from "@supabase/supabase-js";
import { safeNext } from "@/lib/auth/redirect";
import { sanitizeSignupRole } from "@/lib/auth/roles";
import {
  type AuthResult,
  signInSchema,
  signUpSchema,
} from "@/lib/auth/schemas";
import { createClient } from "@/lib/supabase/server";

const DEMO_ERROR = "Logowanie nie działa w wersji demonstracyjnej.";
const RATE_LIMIT_ERROR =
  "Za dużo prób. Odczekaj kilka minut i spróbuj ponownie.";

function signInError(error: AuthError): string {
  if (error.code === "email_not_confirmed") {
    return "Potwierdź adres e-mail. Link wysłaliśmy na Twoją skrzynkę.";
  }
  if (error.status === 429) return RATE_LIMIT_ERROR;
  if (error.code === "invalid_credentials" || error.status === 400) {
    return "E-mail lub hasło są nieprawidłowe.";
  }
  return "Nie udało się zalogować. Spróbuj ponownie za chwilę.";
}

function signUpError(error: AuthError): string {
  if (error.code === "user_already_exists" || error.code === "email_exists") {
    return "Konto z tym adresem już istnieje. Zaloguj się.";
  }
  if (error.code === "weak_password") {
    return "Hasło musi mieć co najmniej 8 znaków.";
  }
  if (error.status === 429) return RATE_LIMIT_ERROR;
  return "Nie udało się założyć konta. Spróbuj ponownie za chwilę.";
}

export async function signIn(
  input: unknown,
  next?: string,
): Promise<AuthResult> {
  const parsed = signInSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0].message };
  }

  const supabase = await createClient();
  if (!supabase) return { ok: false, error: DEMO_ERROR };

  const { error } = await supabase.auth.signInWithPassword(parsed.data);
  if (error) return { ok: false, error: signInError(error) };

  revalidatePath("/", "layout");
  return { ok: true, redirectTo: safeNext(next) };
}

export async function signUp(
  input: unknown,
  next?: string,
): Promise<AuthResult> {
  const raw =
    typeof input === "object" && input !== null
      ? (input as Record<string, unknown>)
      : {};
  // The role is sanitized before validation, so a tampered "admin" becomes
  // "resident" instead of an error the attacker could probe.
  const parsed = signUpSchema.safeParse({
    ...raw,
    role: sanitizeSignupRole(raw.role),
  });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0].message };
  }

  const supabase = await createClient();
  if (!supabase) return { ok: false, error: DEMO_ERROR };

  const { displayName, email, password, role, municipality } = parsed.data;
  const redirectTo = safeNext(next);
  const origin = (await headers()).get("origin");

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        display_name: displayName,
        role,
        ...(municipality ? { municipality } : {}),
      },
      ...(origin
        ? {
            emailRedirectTo: `${origin}/auth/callback?next=${encodeURIComponent(redirectTo)}`,
          }
        : {}),
    },
  });
  if (error) return { ok: false, error: signUpError(error) };

  // With e-mail confirmation on, Supabase hides an existing account behind a
  // user object that has no identities.
  if (data.user && data.user.identities?.length === 0) {
    return {
      ok: false,
      error: "Konto z tym adresem już istnieje. Zaloguj się.",
    };
  }

  revalidatePath("/", "layout");
  return { ok: true, redirectTo, needsConfirmation: !data.session };
}

export async function signOut(): Promise<void> {
  const supabase = await createClient();
  if (supabase) {
    await supabase.auth.signOut();
    revalidatePath("/", "layout");
  }
  redirect("/");
}
