import { embed, embedMany } from "ai";
import { openai } from "@ai-sdk/openai";
import type { Innovation } from "@/types";
import { EMBEDDING_MODEL } from "./models";
import { CATEGORY_THEMES } from "@/lib/match/rerank";

export async function embedText(
  text: string,
  signal?: AbortSignal,
): Promise<number[]> {
  const { embedding } = await embed({
    model: openai.embedding(EMBEDDING_MODEL),
    value: text,
    maxRetries: 0,
    abortSignal: signal
      ? AbortSignal.any([signal, AbortSignal.timeout(4000)])
      : AbortSignal.timeout(4000),
  });
  return embedding;
}

export async function embedTexts(texts: string[]): Promise<number[][]> {
  if (!texts.length) return [];
  const { embeddings } = await embedMany({
    model: openai.embedding(EMBEDDING_MODEL),
    values: texts,
    maxRetries: 0,
    abortSignal: AbortSignal.timeout(4000),
  });
  return embeddings;
}

/**
 * Text embedded for each innovation. Labelled fields plus a plain-language
 * description of the category measurably separate categories better for short
 * Polish problem descriptions than the bare fields did.
 * Changing this function changes every stored vector: re-run
 * `npm run embed:innovations -- --all` afterwards.
 */
export function innovationEmbeddingText(
  innovation: Innovation & { summary?: string | null },
): string {
  const theme = CATEGORY_THEMES[innovation.category];
  return [
    `Tytuł: ${innovation.title}`,
    innovation.category &&
      `Obszar: ${innovation.category}${theme ? ` (${theme})` : ""}`,
    innovation.targetGroup && `Dla kogo: ${innovation.targetGroup}`,
    innovation.tags.length > 0 &&
      `Słowa kluczowe: ${innovation.tags.join(", ")}`,
    innovation.summary && `Streszczenie: ${innovation.summary}`,
    innovation.description && `Opis: ${innovation.description}`,
  ]
    .filter(Boolean)
    .join("\n");
}
