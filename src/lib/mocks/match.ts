import type { Innovation, MatchRequest, MatchResult } from "@/types";
import { innovations } from "@/lib/mocks/innovations";

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
      (token) => token.length >= MIN_TOKEN_LENGTH && !STOP_WORDS.has(token),
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

function buildReason(
  hits: string[],
  categoryMatch: boolean,
  category: string,
): string {
  const parts: string[] = [];
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
      return {
        innovation,
        hits,
        categoryMatch,
        score: hits.length + (categoryMatch ? 3 : 0),
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
      ),
    }));
}
