import { describe, expect, it } from "vitest";
import {
  ACCOUNT_EXISTS_ERROR,
  EMAIL_INVALID_ERROR,
  EMAIL_SEND_ERROR,
  RATE_LIMIT_ERROR,
  SIGN_UP_ERROR,
  signInError,
  signUpError,
} from "@/lib/auth/errors";

describe("signUpError", () => {
  it("says the confirmation e-mail could not be sent when the mail quota is used up", () => {
    expect(
      signUpError({ code: "over_email_send_rate_limit", status: 429 }),
    ).toBe(EMAIL_SEND_ERROR);
    expect(EMAIL_SEND_ERROR).toBe(
      "Nie możemy teraz wysłać e-maila z potwierdzeniem. Spróbuj ponownie za godzinę albo napisz do nas.",
    );
  });

  it("uses the same message when the mailer refuses the address", () => {
    expect(
      signUpError({ code: "email_address_not_authorized", status: 400 }),
    ).toBe(EMAIL_SEND_ERROR);
  });

  it("asks for another address when Supabase rejects the e-mail", () => {
    expect(signUpError({ code: "email_address_invalid", status: 400 })).toBe(
      "Ten adres e-mail jest nieprawidłowy. Użyj innego adresu.",
    );
    expect(EMAIL_INVALID_ERROR).toBe(
      "Ten adres e-mail jest nieprawidłowy. Użyj innego adresu.",
    );
  });

  it("keeps the too-many-attempts message for other rate limits", () => {
    expect(signUpError({ code: "over_request_rate_limit", status: 429 })).toBe(
      RATE_LIMIT_ERROR,
    );
    expect(signUpError({ status: 429 })).toBe(RATE_LIMIT_ERROR);
  });

  it("keeps the existing-account and weak-password messages", () => {
    expect(signUpError({ code: "user_already_exists", status: 422 })).toBe(
      ACCOUNT_EXISTS_ERROR,
    );
    expect(signUpError({ code: "email_exists", status: 422 })).toBe(
      ACCOUNT_EXISTS_ERROR,
    );
    expect(signUpError({ code: "weak_password", status: 422 })).toBe(
      "Hasło musi mieć co najmniej 8 znaków.",
    );
  });

  it("falls back to the generic message for anything else", () => {
    expect(signUpError({ code: "unexpected_failure", status: 500 })).toBe(
      SIGN_UP_ERROR,
    );
    expect(signUpError({ code: "validation_failed", status: 400 })).toBe(
      SIGN_UP_ERROR,
    );
    expect(signUpError({})).toBe(SIGN_UP_ERROR);
  });
});

describe("signInError", () => {
  it("is unchanged", () => {
    expect(signInError({ code: "email_not_confirmed", status: 400 })).toBe(
      "Potwierdź adres e-mail. Link wysłaliśmy na Twoją skrzynkę.",
    );
    expect(signInError({ code: "over_request_rate_limit", status: 429 })).toBe(
      RATE_LIMIT_ERROR,
    );
    expect(signInError({ code: "invalid_credentials", status: 400 })).toBe(
      "E-mail lub hasło są nieprawidłowe.",
    );
    expect(signInError({ code: "unexpected_failure", status: 500 })).toBe(
      "Nie udało się zalogować. Spróbuj ponownie za chwilę.",
    );
  });
});
