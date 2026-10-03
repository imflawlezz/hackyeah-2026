const pluralRules = new Intl.PluralRules("pl");

const MATCHING_INNOVATIONS: Record<
  "one" | "few" | "many",
  { adjective: string; noun: string }
> = {
  one: { adjective: "pasującą", noun: "innowację" },
  few: { adjective: "pasujące", noun: "innowacje" },
  many: { adjective: "pasujących", noun: "innowacji" },
};

/** "Znaleźliśmy 1 pasującą innowację", "… 3 pasujące innowacje", "… 5 pasujących innowacji". */
export function foundInnovationsText(count: number): string {
  const category = pluralRules.select(count);
  const form =
    category === "one" || category === "few"
      ? MATCHING_INNOVATIONS[category]
      : MATCHING_INNOVATIONS.many;
  return `Znaleźliśmy ${count} ${form.adjective} ${form.noun}`;
}
