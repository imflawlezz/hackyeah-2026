const pluralRules = new Intl.PluralRules("pl");

type Form = "one" | "few" | "many";

function form(count: number): Form {
  const category = pluralRules.select(count);
  return category === "one" || category === "few" ? category : "many";
}

const ACCUSATIVE: Record<Form, string> = {
  one: "innowację",
  few: "innowacje",
  many: "innowacji",
};

const NOMINATIVE: Record<Form, string> = {
  one: "innowacja",
  few: "innowacje",
  many: "innowacji",
};

/** "Znaleziono 1 innowację", "… 3 innowacje", "… 7 innowacji". */
export function foundCountText(count: number): string {
  return `Znaleziono ${count} ${ACCUSATIVE[form(count)]}`;
}

/** "1 innowacja", "3 innowacje", "7 innowacji". */
export function innovationCountText(count: number): string {
  return `${count} ${NOMINATIVE[form(count)]}`;
}
