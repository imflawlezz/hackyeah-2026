const pluralRules = new Intl.PluralRules("pl");

type Form = "one" | "few" | "many";

function form(count: number): Form {
  const category = pluralRules.select(count);
  return category === "one" || category === "few" ? category : "many";
}

const OPINIONS: Record<Form, string> = {
  one: "opinia",
  few: "opinie",
  many: "opinii",
};

const TESTS: Record<Form, string> = {
  one: "test",
  few: "testy",
  many: "testów",
};

/** "Zostało 1 miejsce", "Zostały 3 miejsca", "Zostało 5 miejsc". */
export function slotsLeftText(count: number): string {
  if (count <= 0) return "Brak wolnych miejsc";
  switch (form(count)) {
    case "one":
      return `Zostało ${count} miejsce`;
    case "few":
      return `Zostały ${count} miejsca`;
    default:
      return `Zostało ${count} miejsc`;
  }
}

/** "1 opinia", "3 opinie", "12 opinii". */
export function opinionsText(count: number): string {
  return `${count} ${OPINIONS[form(count)]}`;
}

/** "1 test", "3 testy", "5 testów". */
export function testsText(count: number): string {
  return `${count} ${TESTS[form(count)]}`;
}

const decimal = new Intl.NumberFormat("pl", {
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
});

/** One decimal place with a comma: 4.2 becomes "4,2", 4 becomes "4,0". */
export function formatDecimal(value: number): string {
  return decimal.format(value);
}

/** A 0–1 share as a whole percentage: 0.75 becomes "75%". */
export function formatShare(share: number): string {
  return `${Math.round(share * 100)}%`;
}

// Tests run on calendar dates, so they are formatted in UTC to avoid a
// timezone moving them to the previous day.
const dayMonth = new Intl.DateTimeFormat("pl", {
  day: "numeric",
  month: "long",
  timeZone: "UTC",
});
const dayMonthYear = new Intl.DateTimeFormat("pl", {
  day: "numeric",
  month: "long",
  year: "numeric",
  timeZone: "UTC",
});

function parseDate(value: string): Date | null {
  const date = new Date(`${value.slice(0, 10)}T00:00:00Z`);
  return Number.isNaN(date.getTime()) ? null : date;
}

/** "15 października – 30 listopada 2026"; the first year shows only when it differs. */
export function formatDateRange(startsAt: string, endsAt: string): string {
  const start = parseDate(startsAt);
  const end = parseDate(endsAt);
  if (!start || !end) return "";
  const sameYear = start.getUTCFullYear() === end.getUTCFullYear();
  return `${(sameYear ? dayMonth : dayMonthYear).format(start)} – ${dayMonthYear.format(end)}`;
}
