import type { Innovation } from "@/types";

/**
 * Hybrid rerank for matching. Embedding similarity from text-embedding-3-small
 * is close together for short Polish descriptions (often 0.40–0.47 for the
 * whole top five), so a small, explainable keyword signal decides the order:
 * - the problem names a theme whose stems point to the innovation's category,
 * - the problem shares words with the innovation's title, tags or target group.
 */

/** Word stems (lowercase prefixes) that signal each library category. */
export const CATEGORY_STEMS: Record<string, string[]> = {
  Dostępność: [
    "wózk",
    "wózek",
    "niepełnospr",
    "barier",
    "dostępn",
    "dostępu",
    "schod",
    "podjazd",
    "wind",
    "niewidom",
    "niedowid",
    "głuch",
    "niesłysz",
    "migow",
    "poruszani",
    "architekton",
  ],
  Samotność: [
    "samotn",
    "osamotn",
    "izolac",
    "izolow",
    "towarzyst",
    "odwiedz",
    "wdow",
  ],
  "Wykluczenie cyfrowe": [
    "cyfrow",
    "smartfon",
    "komputer",
    "internet",
    "tablet",
    "aplikac",
    "online",
    "e-urz",
    "e-recept",
    "profil zaufan",
  ],
  Opieka: [
    "opiek",
    "wytchnien",
    "niesamodziel",
    "pielęgn",
    "rehabilit",
    "chor",
    "obłożn",
  ],
  "Zdrowie psychiczne": [
    "psychicz",
    "psycholog",
    "psychiatr",
    "depres",
    "lęk",
    "samobój",
    "wypaleni",
    "stres",
    "kryzys psych",
  ],
  Młodzież: [
    "młodzież",
    "młodych",
    "nastolat",
    "uczni",
    "uczeń",
    "szkoł",
    "dzieci",
    "dzieck",
  ],
  Aktywizacja: [
    "aktywiz",
    "bezrobot",
    "zatrudn",
    "pracy",
    "praca",
    "zawod",
    "wolontar",
  ],
  Bezdomność: ["bezdom", "noclegow", "noclegu", "schronisk", "eksmis"],
};

/**
 * Plain-language description of each category, added to the embedding input
 * so a problem described in everyday words lands near the right category.
 */
export const CATEGORY_THEMES: Record<string, string> = {
  Dostępność:
    "niepełnosprawność, osoby na wózkach, bariery architektoniczne, dostępność budynków i urzędów, osoby niewidome i niesłyszące",
  Samotność:
    "samotność, izolacja społeczna, brak kontaktu z innymi, osamotnienie seniorów",
  "Wykluczenie cyfrowe":
    "wykluczenie cyfrowe, obsługa smartfona, komputera i internetu, e-usługi",
  Opieka:
    "opieka nad osobami niesamodzielnymi, opiekunowie rodzinni, wytchnienie",
  "Zdrowie psychiczne":
    "zdrowie psychiczne, kryzys psychiczny, depresja, wsparcie psychologiczne",
  Młodzież: "dzieci i młodzież, uczniowie, szkoła, czas wolny",
  Aktywizacja: "aktywizacja zawodowa i społeczna, praca, wolontariat",
  Bezdomność: "bezdomność, nocleg, kryzys mieszkaniowy",
};

/** Boost when the problem's theme matches the innovation's category. */
export const CATEGORY_BOOST = 0.06;
/** Boost per shared keyword with title, tags or target group, capped. */
export const KEYWORD_BOOST = 0.015;
export const KEYWORD_BOOST_CAP = 0.045;

const STEM = 5;
const MIN_TOKEN = 4;
// Frequent words that say nothing about the theme of a problem.
export const GENERIC_WORDS = new Set([
  "osoby",
  "osób",
  "ludzi",
  "ludzie",
  "mieszkańcy",
  "mieszkańców",
  "gmina",
  "gminy",
  "gminie",
  "naszej",
  "nasza",
  "naszym",
  "brakuje",
  "brak",
  "mogą",
  "może",
  "mają",
  "który",
  "która",
  "które",
  "których",
  "przez",
  "oraz",
  "także",
  "bardzo",
  "często",
  "potrzebują",
  "potrzeba",
  "problem",
  "problemy",
  "wsparcia",
  "wsparcie",
  "pomocy",
  "pomoc",
]);

export function tokenize(text: string): string[] {
  return text
    .toLocaleLowerCase("pl")
    .split(/[^a-ząćęłńóśźż0-9-]+/)
    .filter((token) => token.length >= MIN_TOKEN && !GENERIC_WORDS.has(token));
}

/** Folds the ą/ę and ó/o alternations, so "urząd" and "urzędu" share a stem. */
function fold(token: string): string {
  return token.replace(/[ąę]/g, "e").replace(/ó/g, "o");
}

function stem(token: string): string {
  return fold(token).slice(0, STEM);
}

/** Categories whose theme stems appear in the problem description. */
export function detectCategories(problem: string): Set<string> {
  const text = problem.toLocaleLowerCase("pl");
  const tokens = tokenize(problem);
  const found = new Set<string>();
  for (const [category, stems] of Object.entries(CATEGORY_STEMS)) {
    const hit = stems.some((s) =>
      s.includes(" ")
        ? text.includes(s)
        : tokens.some((token) => token.startsWith(s)),
    );
    if (hit) found.add(category);
  }
  return found;
}

function keywordStems(innovation: Innovation): Set<string> {
  return new Set(
    tokenize(
      [
        innovation.title,
        innovation.targetGroup,
        innovation.category,
        innovation.tags.join(" "),
      ].join(" "),
    ).map(stem),
  );
}

export type RerankSignal = {
  boost: number;
  categoryMatch: boolean;
  sharedKeywords: string[];
};

export function rerankSignal(
  problem: string,
  innovation: Innovation,
  categories = detectCategories(problem),
): RerankSignal {
  const categoryMatch = categories.has(innovation.category);
  const stems = keywordStems(innovation);
  const shared = [
    ...new Set(tokenize(problem).filter((token) => stems.has(stem(token)))),
  ];
  const keywordBoost = Math.min(
    KEYWORD_BOOST_CAP,
    shared.length * KEYWORD_BOOST,
  );
  return {
    boost: (categoryMatch ? CATEGORY_BOOST : 0) + keywordBoost,
    categoryMatch,
    sharedKeywords: shared,
  };
}

/**
 * Adds the keyword boost to each similarity and sorts best first. The raw
 * similarity is kept so callers can still log or store it.
 */
export function rerank<
  T extends { innovation: Innovation; similarity: number },
>(
  problem: string,
  items: T[],
): (T & { score: number; signal: RerankSignal })[] {
  const categories = detectCategories(problem);
  return items
    .map((item) => {
      const signal = rerankSignal(problem, item.innovation, categories);
      return { ...item, signal, score: item.similarity + signal.boost };
    })
    .sort(
      (a, b) =>
        b.score - a.score ||
        a.innovation.title.localeCompare(b.innovation.title, "pl"),
    );
}
