import type { Innovation } from "@/types";

export type InnovationFilters = {
  q?: string;
  /** One category or several; an innovation matches when it is in any of them. */
  category?: string | readonly string[];
  targetGroup?: string;
};

/** Lowercase, without diacritics: "Świetlica" and "swietlica" become equal. */
export function normalizeText(value: string): string {
  return (
    value
      .toLocaleLowerCase("pl")
      .normalize("NFD")
      .replace(/\p{Diacritic}/gu, "")
      // "ł" has no decomposed form.
      .replace(/ł/g, "l")
      .replace(/\s+/g, " ")
      .trim()
  );
}

function toList(value: string | readonly string[] | undefined): string[] {
  if (!value) return [];
  return (typeof value === "string" ? [value] : [...value]).filter(Boolean);
}

/** Every word of `q` must appear in the title, description or tags. */
export function filterInnovations(
  list: readonly Innovation[],
  { q, category, targetGroup }: InnovationFilters,
): Innovation[] {
  const words = normalizeText(q ?? "")
    .split(" ")
    .filter(Boolean);
  const categories = toList(category).map(normalizeText);
  const group = normalizeText(targetGroup ?? "");

  return list.filter((innovation) => {
    if (
      categories.length > 0 &&
      !categories.includes(normalizeText(innovation.category))
    ) {
      return false;
    }
    if (group && normalizeText(innovation.targetGroup) !== group) {
      return false;
    }
    if (words.length === 0) return true;
    const haystack = normalizeText(
      [innovation.title, innovation.description, ...innovation.tags].join(" "),
    );
    return words.every((word) => haystack.includes(word));
  });
}

/** Distinct values in Polish alphabetical order, for filter options. */
export function distinctSorted(values: readonly string[]): string[] {
  return [...new Set(values.filter(Boolean))].sort((left, right) =>
    left.localeCompare(right, "pl"),
  );
}
