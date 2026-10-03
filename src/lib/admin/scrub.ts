const EMAIL = /[\p{L}\p{N}._%+-]+@[\p{L}\p{N}.-]+\.[\p{L}]{2,}/gu;
// Any run of digits with up to two separators between them, optionally starting
// with +, 00 or "(". Runs of 9–15 digits are phone numbers (Polish numbers have
// 9, or 11 with +48); shorter runs such as years or counts are kept.
const PHONE = /(?:\+|\b00)?\(?\d(?:[\s().-]{0,2}\d){5,14}/g;
const MIN_PHONE_DIGITS = 9;

export const EXCERPT_LENGTH = 300;

/** Replaces e-mail addresses and phone numbers with placeholders. */
export function scrubPII(text: string): string {
  return text
    .replace(EMAIL, "[e-mail]")
    .replace(PHONE, (match) =>
      match.replace(/\D/g, "").length >= MIN_PHONE_DIGITS ? "[telefon]" : match,
    );
}

/** Scrubbed, whitespace-collapsed text cut to `length` characters. */
export function toExcerpt(text: string, length = EXCERPT_LENGTH): string {
  const clean = scrubPII(text).replace(/\s+/g, " ").trim();
  return clean.length > length ? `${clean.slice(0, length - 1)}…` : clean;
}
