import { embed, embedMany } from "ai";
import { openai } from "@ai-sdk/openai";
import type { Innovation } from "@/types";
import { EMBEDDING_MODEL } from "./models";

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

export function innovationEmbeddingText(
  innovation: Innovation & { summary?: string | null },
): string {
  return [
    innovation.title,
    innovation.summary,
    innovation.description,
    innovation.category,
    innovation.targetGroup,
    innovation.tags.join(", "),
  ]
    .filter(Boolean)
    .join("\n");
}
