import type { Innovation, MatchRequest, MatchResult } from "@/types";
import { innovations } from "@/lib/mocks/innovations";
import { detectCategories, GENERIC_WORDS } from "@/lib/match/rerank";

const STOP_WORDS = new Set([
  "oraz",
  "albo",
  "czyli",
  "jest",
  "są",
  "się",
  "nie",
  "dla",
  "przez",
  "przy",
  "pod",
  "nad",
  "bez",
  "jak",
  "już",
  "tylko",
  "tego",
  "tej",
  "ten",
  "ta",
  "te",
  "tym",
  "ich",
  "ona",
  "ono",
  "jego",
  "jej",
  "lub",
  "czy",
  "aby",
  "żeby",
  "też",
  "który",
  "która",
  "które",
  "których",
  "mają",
  "może",
  "mogą",
  "przed",
  "między",
  "ani",
]);

const DEFAULT_LIMIT = 5;
const MIN_TOKEN_LENGTH = 3;
const STEM_LENGTH = 5;

function tokenize(value: string): string[] {
  return value
    .toLocaleLowerCase("pl")
    .split(/[^a-ząćęłńóśźż0-9]+/)
    .filter(
      (token) =>
        token.length >= MIN_TOKEN_LENGTH &&
        !STOP_WORDS.has(token) &&
        !GENERIC_WORDS.has(token),
    );
}

function stemsMatch(left: string, right: string): boolean {
  if (left === right) {
    return true;
  }
  if (left.length < STEM_LENGTH || right.length < STEM_LENGTH) {
    return false;
  }
  return left.slice(0, STEM_LENGTH) === right.slice(0, STEM_LENGTH);
}

function innovationWords(innovation: Innovation): string[] {
  return tokenize(
    [
      innovation.title,
      innovation.description,
      innovation.category,
      innovation.targetGroup,
      innovation.tags.join(" "),
    ].join(" "),
  );
}

/** Points for a problem whose theme points to the innovation's category. */
const THEME_POINTS = 2;

function buildReason(
  hits: string[],
  categoryMatch: boolean,
  category: string,
  themeMatch = false,
): string {
  const parts: string[] = [];
  if (themeMatch && !categoryMatch) {
    parts.push(`Twój opis dotyczy obszaru: ${category}.`);
  }
  if (hits.length > 0) {
    parts.push(`Wspólne słowa z Twoim opisem: ${hits.join(", ")}.`);
  }
  if (categoryMatch) {
    parts.push(`Wybrana przez Ciebie kategoria: ${category}.`);
  }
  return parts.join(" ");
}

export function mockMatch(request: MatchRequest): MatchResult[] {
  const requestedLimit = request.limit ?? DEFAULT_LIMIT;
  const limit = requestedLimit > 0 ? requestedLimit : DEFAULT_LIMIT;
  const tokens = tokenize(request.problem);
  const category = request.category?.trim().toLocaleLowerCase("pl");
  const themes = detectCategories(request.problem);

  // Same strict rule as the AI path: a requested category limits the results to it.
  const candidates = category
    ? innovations.filter(
        (innovation) =>
          innovation.category.toLocaleLowerCase("pl") === category,
      )
    : innovations;

  return candidates
    .map((innovation) => {
      const words = innovationWords(innovation);
      const hits = tokens.filter((token) =>
        words.some((word) => stemsMatch(token, word)),
      );
      const categoryMatch = Boolean(
        category && innovation.category.toLocaleLowerCase("pl") === category,
      );
      const themeMatch = themes.has(innovation.category);
      return {
        innovation,
        hits,
        categoryMatch,
        themeMatch,
        score:
          hits.length +
          (categoryMatch ? 3 : 0) +
          (themeMatch ? THEME_POINTS : 0),
      };
    })
    .filter((item) => item.score > 0)
    .sort((left, right) => {
      if (right.score !== left.score) {
        return right.score - left.score;
      }
      return left.innovation.title.localeCompare(right.innovation.title, "pl");
    })
    .slice(0, limit)
    .map((item) => ({
      innovation: item.innovation,
      score: item.score,
      reason: buildReason(
        item.hits,
        item.categoryMatch,
        item.innovation.category,
        item.themeMatch,
      ),
    }));
}
