import { z } from "zod";
import {
  BUDGET_BAND_LABELS,
  INSTITUTION_TYPE_LABELS,
  MUNICIPALITY_TYPE_LABELS,
  POPULATION_BAND_LABELS,
  TIMELINE_LABELS,
} from "@/lib/institutions/labels";
import type { InstitutionProfile } from "@/types";

export const NEED_MIN_LENGTH = 10;
export const NEED_MAX_LENGTH = 1500;
export const CONSTRAINTS_MAX_LENGTH = 1000;
export const TARGET_GROUP_MAX_LENGTH = 200;

function options<T extends string | number>(labels: Record<T, string>) {
  return (Object.entries(labels) as [string, string][]).map(
    ([value, label]) => ({ value, label }),
  );
}

export const INSTITUTION_TYPE_OPTIONS = options(INSTITUTION_TYPE_LABELS);
export const MUNICIPALITY_TYPE_OPTIONS = options(MUNICIPALITY_TYPE_LABELS);
export const POPULATION_BAND_OPTIONS = options(POPULATION_BAND_LABELS);
export const BUDGET_BAND_OPTIONS = options(BUDGET_BAND_LABELS);
export const TIMELINE_OPTIONS = options(TIMELINE_LABELS);

// react-hook-form reports an untouched radio group as "" (our default) but an
// emptied one as null, so both mean "nothing chosen".
const choice = z
  .string()
  .nullable()
  .transform((value) => value ?? "");

function oneOf<T extends string>(labels: Record<T, string>, message: string) {
  return choice
    .refine((value) => value in labels, message)
    .transform((value) => value as T);
}

/** The profile form: every control posts strings; the output is an InstitutionProfile. */
export const profileFormSchema = z.object({
  institutionType: oneOf(INSTITUTION_TYPE_LABELS, "Wybierz typ instytucji."),
  municipalityType: choice
    .refine(
      (value) => value === "" || value in MUNICIPALITY_TYPE_LABELS,
      "Wybierz rodzaj gminy z listy.",
    )
    .transform((value) =>
      value === ""
        ? undefined
        : (value as NonNullable<InstitutionProfile["municipalityType"]>),
    ),
  populationBand: oneOf(POPULATION_BAND_LABELS, "Wybierz liczbę mieszkańców."),
  budgetBand: oneOf(BUDGET_BAND_LABELS, "Wybierz roczny budżet."),
  staffAvailable: z
    .string()
    .trim()
    .refine(
      (value) => /^\d{1,2}$/.test(value) && Number(value) <= 20,
      "Podaj liczbę osób od 0 do 20.",
    )
    .transform(Number),
  targetGroup: z
    .string()
    .trim()
    .min(1, "Napisz, kogo ma objąć wsparcie.")
    .max(
      TARGET_GROUP_MAX_LENGTH,
      `Opis grupy może mieć najwyżej ${TARGET_GROUP_MAX_LENGTH} znaków. Skróć go.`,
    ),
  need: z
    .string()
    .trim()
    .min(
      NEED_MIN_LENGTH,
      `Opisz potrzebę. Napisz co najmniej ${NEED_MIN_LENGTH} znaków.`,
    )
    .max(
      NEED_MAX_LENGTH,
      `Opis może mieć najwyżej ${NEED_MAX_LENGTH} znaków. Skróć go.`,
    ),
  constraints: z
    .string()
    .trim()
    .max(
      CONSTRAINTS_MAX_LENGTH,
      `Opis ograniczeń może mieć najwyżej ${CONSTRAINTS_MAX_LENGTH} znaków. Skróć go.`,
    )
    .transform((value) => value || undefined),
  timeline: choice
    .refine((value) => value in TIMELINE_LABELS, "Wybierz termin.")
    .transform((value) => Number(value) as InstitutionProfile["timeline"]),
});

export type ProfileFormInput = z.input<typeof profileFormSchema>;
export type ProfileFormValues = z.output<typeof profileFormSchema>;

export const PROFILE_FORM_DEFAULTS: ProfileFormInput = {
  institutionType: "",
  municipalityType: "",
  populationBand: "",
  budgetBand: "",
  staffAvailable: "",
  targetGroup: "",
  need: "",
  constraints: "",
  timeline: "",
};

export const PROFILE_STORAGE_KEY = "hubmi-institution-profile";

/** Stored answers, limited to known keys with string values. */
export function parseStoredProfile(
  raw: string | null,
): ProfileFormInput | null {
  if (!raw) return null;
  try {
    const parsed: unknown = JSON.parse(raw);
    if (typeof parsed !== "object" || parsed === null) return null;
    const stored = parsed as Record<string, unknown>;
    const restored = { ...PROFILE_FORM_DEFAULTS };
    for (const key of Object.keys(restored) as (keyof ProfileFormInput)[]) {
      const value = stored[key];
      if (typeof value === "string") restored[key] = value;
    }
    return restored;
  } catch {
    return null;
  }
}
