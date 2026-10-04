/** The parts of a Supabase AuthError the messages depend on. */
export type AuthErrorLike = { code?: string; status?: number };

export const RATE_LIMIT_ERROR =
  "Za dużo prób. Odczekaj kilka minut i spróbuj ponownie.";
export const EMAIL_SEND_ERROR =
  "Nie możemy teraz wysłać e-maila z potwierdzeniem. Spróbuj ponownie za godzinę albo napisz do nas.";
export const EMAIL_INVALID_ERROR =
  "Ten adres e-mail jest nieprawidłowy. Użyj innego adresu.";
export const ACCOUNT_EXISTS_ERROR =
  "Konto z tym adresem już istnieje. Zaloguj się.";
export const SIGN_UP_ERROR =
  "Nie udało się założyć konta. Spróbuj ponownie za chwilę.";

export function signInError(error: AuthErrorLike): string {
  if (error.code === "email_not_confirmed") {
    return "Potwierdź adres e-mail. Link wysłaliśmy na Twoją skrzynkę.";
  }
  if (error.status === 429) return RATE_LIMIT_ERROR;
  if (error.code === "invalid_credentials" || error.status === 400) {
    return "E-mail lub hasło są nieprawidłowe.";
  }
  return "Nie udało się zalogować. Spróbuj ponownie za chwilę.";
}

export function signUpError(error: AuthErrorLike): string {
  if (error.code === "user_already_exists" || error.code === "email_exists") {
    return ACCOUNT_EXISTS_ERROR;
  }
  if (error.code === "weak_password") {
    return "Hasło musi mieć co najmniej 8 znaków.";
  }
  // The confirmation e-mail could not be sent: the project's mail quota is
  // used up, or the mailer refuses the address. Neither is the visitor's
  // doing, so these must not fall into the "too many attempts" message below.
  if (
    error.code === "over_email_send_rate_limit" ||
    error.code === "email_address_not_authorized"
  ) {
    return EMAIL_SEND_ERROR;
  }
  if (error.code === "email_address_invalid") return EMAIL_INVALID_ERROR;
  if (error.status === 429) return RATE_LIMIT_ERROR;
  return SIGN_UP_ERROR;
}
