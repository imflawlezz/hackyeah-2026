import type {
  BudgetBand,
  InstitutionProfile,
  InstitutionType,
  MunicipalityType,
  PopulationBand,
} from "@/types";

export const INSTITUTION_TYPE_LABELS: Record<InstitutionType, string> = {
  gmina: "Gmina",
  powiat: "Powiat",
  ops_cus: "OPS lub CUS",
  pcpr: "PCPR",
  dps_sds: "DPS lub ŚDS",
  ngo: "Organizacja pozarządowa",
  school: "Szkoła",
  other: "Inna instytucja",
};

export const MUNICIPALITY_TYPE_LABELS: Record<MunicipalityType, string> = {
  wiejska: "Wiejska",
  "miejsko-wiejska": "Miejsko-wiejska",
  miejska: "Miejska",
};

export const POPULATION_BAND_LABELS: Record<PopulationBand, string> = {
  "<5k": "Do 5 tys.",
  "5-20k": "5–20 tys.",
  "20-100k": "20–100 tys.",
  ">100k": "Ponad 100 tys.",
};

export const BUDGET_BAND_LABELS: Record<BudgetBand, string> = {
  "<20k": "Do 20 tys. zł",
  "20-100k": "20–100 tys. zł",
  "100-500k": "100–500 tys. zł",
  ">500k": "Ponad 500 tys. zł",
};

export const TIMELINE_LABELS: Record<InstitutionProfile["timeline"], string> = {
  3: "Za 3 miesiące",
  6: "Za 6 miesięcy",
  12: "Za 12 miesięcy",
};

/** Yearly range in PLN that each band stands for when costs are estimated. */
export const BUDGET_BAND_RANGE: Record<
  BudgetBand,
  { min: number; max: number }
> = {
  "<20k": { min: 5_000, max: 20_000 },
  "20-100k": { min: 20_000, max: 100_000 },
  "100-500k": { min: 100_000, max: 500_000 },
  ">500k": { min: 500_000, max: 1_000_000 },
};

const pln = new Intl.NumberFormat("pl-PL", {
  style: "currency",
  currency: "PLN",
  maximumFractionDigits: 0,
});

/** "20 000 zł", with the non-breaking spaces Intl produces. */
export function formatPln(amount: number): string {
  return pln.format(amount);
}

/** "20 000 zł – 100 000 zł". */
export function formatPlnRange(min: number, max: number): string {
  return min === max ? formatPln(min) : `${formatPln(min)} – ${formatPln(max)}`;
}

const pluralRules = new Intl.PluralRules("pl");

/** "1 tydzień", "3 tygodnie", "5 tygodni". */
export function weeksText(count: number): string {
  const category = pluralRules.select(count);
  const noun =
    category === "one"
      ? "tydzień"
      : category === "few"
        ? "tygodnie"
        : "tygodni";
  return `${count} ${noun}`;
}

/** "1 osoba", "3 osoby", "5 osób". */
export function peopleText(count: number): string {
  const category = pluralRules.select(count);
  const noun =
    category === "one" ? "osoba" : category === "few" ? "osoby" : "osób";
  return `${count} ${noun}`;
}

/** One line per answer, used on the plan and in the Markdown export. */
export function profileSummary(
  profile: InstitutionProfile,
): { label: string; value: string }[] {
  return [
    {
      label: "Typ instytucji",
      value: INSTITUTION_TYPE_LABELS[profile.institutionType],
    },
    ...(profile.municipalityType
      ? [
          {
            label: "Rodzaj gminy",
            value: MUNICIPALITY_TYPE_LABELS[profile.municipalityType],
          },
        ]
      : []),
    {
      label: "Liczba mieszkańców",
      value: POPULATION_BAND_LABELS[profile.populationBand],
    },
    {
      label: "Roczny budżet na to działanie",
      value: BUDGET_BAND_LABELS[profile.budgetBand],
    },
    { label: "Zespół", value: peopleText(profile.staffAvailable) },
    { label: "Kogo ma objąć wsparcie", value: profile.targetGroup },
    { label: "Start", value: TIMELINE_LABELS[profile.timeline].toLowerCase() },
  ];
}
