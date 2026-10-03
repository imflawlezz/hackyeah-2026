import { z } from "zod";
import { availabilitySchema } from "@/lib/validators";
import type { Availability, Rating } from "@/types";

export const TEXT_MAX_LENGTH = 1000;

export const AVAILABILITY_OPTIONS: { value: Availability; label: string }[] = [
  { value: "morning", label: "Rano" },
  { value: "afternoon", label: "Po południu" },
  { value: "evening", label: "Wieczorem" },
  { value: "weekend", label: "W weekend" },
];

export const RATING_OPTIONS: { value: Rating; label: string }[] = [
  { value: 1, label: "1 – bardzo słabo" },
  { value: 2, label: "2 – słabo" },
  { value: 3, label: "3 – średnio" },
  { value: 4, label: "4 – dobrze" },
  { value: 5, label: "5 – bardzo dobrze" },
];

export const EASE_OPTIONS: { value: Rating; label: string }[] = [
  { value: 1, label: "1 – bardzo trudne" },
  { value: 2, label: "2 – trudne" },
  { value: 3, label: "3 – średnio" },
  { value: 4, label: "4 – proste" },
  { value: 5, label: "5 – bardzo proste" },
];

export const RECOMMEND_OPTIONS = [
  { value: "yes", label: "Tak" },
  { value: "no", label: "Nie" },
] as const;

const TOO_LONG = `Tekst może mieć najwyżej ${TEXT_MAX_LENGTH} znaków. Skróć go.`;

/** Optional free text: trimmed, empty becomes undefined. */
const optionalText = z
  .string()
  .trim()
  .max(TEXT_MAX_LENGTH, TOO_LONG)
  .transform((value) => value || undefined);

// react-hook-form reports an untouched radio group as "" (our default) but an
// emptied one as null, so both mean "nothing chosen".
const radioValue = z
  .string()
  .nullable()
  .transform((value) => value ?? "");

function ratingChoice(message: string) {
  return radioValue
    .refine((value) => /^[1-5]$/.test(value), message)
    .transform((value) => Number(value) as Rating);
}

const optionalRatingChoice = radioValue
  .refine(
    (value) => value === "" || /^[1-5]$/.test(value),
    "Wybierz ocenę od 1 do 5.",
  )
  .transform((value) => (value === "" ? undefined : (Number(value) as Rating)));

export const signupFormSchema = z.object({
  motivation: optionalText,
  availability: radioValue
    .refine(
      (value) => availabilitySchema.safeParse(value).success,
      "Wybierz, kiedy możesz wziąć udział.",
    )
    .transform((value) => value as Availability),
  accessibilityNeeds: optionalText,
  consent: z
    .boolean()
    .refine(
      (value) => value,
      "Zaznacz zgodę na kontakt. Bez niej nie możemy potwierdzić zgłoszenia.",
    ),
});

export type SignupFormInput = z.input<typeof signupFormSchema>;
export type SignupFormValues = z.output<typeof signupFormSchema>;

export const SIGNUP_FORM_DEFAULTS: SignupFormInput = {
  motivation: "",
  availability: "",
  accessibilityNeeds: "",
  consent: false,
};

export const feedbackFormSchema = z.object({
  rating: ratingChoice("Wybierz ocenę od 1 do 5."),
  easeOfUse: optionalRatingChoice,
  wouldRecommend: radioValue
    .refine(
      (value) => value === "" || value === "yes" || value === "no",
      "Wybierz „Tak” albo „Nie”.",
    )
    .transform((value) => (value === "" ? undefined : value === "yes")),
  whatWorked: optionalText,
  whatToImprove: optionalText,
  comment: optionalText,
  /** The test this opinion is about, when the innovation has one. */
  testId: z
    .string()
    .optional()
    .transform((value) => value || undefined),
});

export type FeedbackFormInput = z.input<typeof feedbackFormSchema>;
export type FeedbackFormValues = z.output<typeof feedbackFormSchema>;

export const FEEDBACK_FORM_DEFAULTS: FeedbackFormInput = {
  rating: "",
  easeOfUse: "",
  wouldRecommend: "",
  whatWorked: "",
  whatToImprove: "",
  comment: "",
  testId: "",
};

export const SIGNUP_MESSAGES = {
  success: "Zgłoszenie wysłane. Odezwiemy się przed startem testu.",
  full: "Brak wolnych miejsc w tym teście.",
  closed: "Ten test jest już zamknięty. Wybierz inny z listy otwartych testów.",
  duplicate:
    "Masz już zgłoszenie do tego testu. Nie musisz wysyłać go ponownie.",
  signedUp:
    "Jesteś zapisany lub zapisana na ten test. Odezwiemy się przed jego startem.",
  cancelHint:
    "Chcesz zrezygnować? Napisz do zespołu ROPS, a usuniemy Twoje zgłoszenie.",
  signedOut: "Zaloguj się, żeby się zgłosić.",
  invalid: "Popraw zaznaczone pola i wyślij zgłoszenie jeszcze raz.",
  failed: "Nie udało się wysłać zgłoszenia. Spróbuj ponownie za chwilę.",
} as const;

export const FEEDBACK_MESSAGES = {
  success: "Dziękujemy. Twoja opinia została zapisana.",
  signedOut: "Zaloguj się, żeby dodać opinię.",
  invalid: "Popraw zaznaczone pola i wyślij opinię jeszcze raz.",
  failed: "Nie udało się zapisać opinii. Spróbuj ponownie za chwilę.",
} as const;
