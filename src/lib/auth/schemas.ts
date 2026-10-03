import { z } from "zod";
import { SIGNUP_ROLES } from "@/lib/auth/roles";

export const PASSWORD_MIN_LENGTH = 8;
// bcrypt, which Supabase Auth uses, ignores everything after 72 bytes.
const PASSWORD_MAX_LENGTH = 72;

const emailSchema = z
  .string()
  .trim()
  .min(1, "Podaj adres e-mail.")
  .pipe(
    z.email("Podaj poprawny adres e-mail, na przykład anna@hubmi.example."),
  );

export const signInSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Podaj hasło."),
});

export const signUpSchema = z.object({
  displayName: z
    .string()
    .trim()
    .min(2, "Podaj imię lub nazwę. Wystarczą 2 znaki.")
    .max(80, "Nazwa może mieć najwyżej 80 znaków."),
  email: emailSchema,
  password: z
    .string()
    .min(PASSWORD_MIN_LENGTH, "Hasło musi mieć co najmniej 8 znaków.")
    .max(PASSWORD_MAX_LENGTH, "Hasło może mieć najwyżej 72 znaki."),
  role: z.enum(SIGNUP_ROLES, "Wybierz, kim jesteś."),
  municipality: z
    .string()
    .trim()
    .max(80, "Nazwa gminy może mieć najwyżej 80 znaków."),
});

export type SignInValues = z.infer<typeof signInSchema>;
export type SignUpValues = z.infer<typeof signUpSchema>;

export type AuthResult =
  | { ok: true; redirectTo: string; needsConfirmation?: boolean }
  | { ok: false; error: string };
