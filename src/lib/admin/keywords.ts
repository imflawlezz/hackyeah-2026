// Function words and words that describe every social problem equally, so
// they would crowd out the words that tell problems apart.
const STOP_WORDS = new Set([
  "aby",
  "ale",
  "albo",
  "ani",
  "bardzo",
  "bez",
  "bo",
  "być",
  "był",
  "była",
  "było",
  "były",
  "bywa",
  "czy",
  "dla",
  "do",
  "dużo",
  "gdy",
  "gdzie",
  "go",
  "ich",
  "jak",
  "jest",
  "jeszcze",
  "już",
  "kiedy",
  "która",
  "które",
  "który",
  "których",
  "lub",
  "mają",
  "mamy",
  "może",
  "mogą",
  "musi",
  "muszą",
  "na",
  "nad",
  "nam",
  "nas",
  "nawet",
  "nic",
  "nie",
  "ma",
  "mało",
  "mniej",
  "od",
  "oraz",
  "po",
  "pod",
  "przez",
  "przy",
  "się",
  "są",
  "ta",
  "tak",
  "też",
  "tego",
  "tej",
  "ten",
  "to",
  "tu",
  "tylko",
  "tym",
  "w",
  "we",
  "więc",
  "wiele",
  "z",
  "za",
  "ze",
  "że",
  "żeby",
  "chce",
  "chcą",
  "chcieliby",
  "dnia",
  "dzień",
  "kogo",
  "kto",
  "mała",
  "małe",
  "małej",
  "mały",
  "nikogo",
  "nikt",
  "wie",
  "wiedzą",
  "wiedzieć",
  // Generic for this domain.
  "domu",
  "gminy",
  "brak",
  "brakuje",
  "gminie",
  "gmina",
  "osoby",
  "osób",
  "problem",
  "problemy",
  "mieszkańcy",
  "mieszkańców",
  "ludzie",
  "ludzi",
]);

const MIN_LENGTH = 3;

export function tokenize(text: string): string[] {
  return text
    .toLocaleLowerCase("pl")
    .split(/[^a-ząćęłńóśźż]+/u)
    .filter((word) => word.length >= MIN_LENGTH && !STOP_WORDS.has(word));
}

export type KeywordCount = { word: string; count: number };

/** Most frequent words across texts; each text counts a word at most once. */
export function topKeywords(
  texts: string[],
  limit = 15,
  minCount = 1,
): KeywordCount[] {
  const counts = new Map<string, number>();
  for (const text of texts) {
    for (const word of new Set(tokenize(text))) {
      counts.set(word, (counts.get(word) ?? 0) + 1);
    }
  }
  return [...counts]
    .filter(([, count]) => count >= minCount)
    .sort(
      ([wordA, countA], [wordB, countB]) =>
        countB - countA || wordA.localeCompare(wordB, "pl"),
    )
    .slice(0, limit)
    .map(([word, count]) => ({ word, count }));
}
