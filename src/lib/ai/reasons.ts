import { generateText, Output } from "ai";
import { openai } from "@ai-sdk/openai";
import { z } from "zod";
import type { Innovation } from "@/types";
import { REASON_MODEL } from "./models";
import { MATCH_REASONS_SYSTEM_PROMPT } from "./prompts";

export async function generateReasons(
  problem: string,
  innovations: Innovation[],
  signal?: AbortSignal,
): Promise<Record<string, string>> {
  if (!innovations.length) return {};
  const { output } = await generateText({
    model: openai(REASON_MODEL),
    system: MATCH_REASONS_SYSTEM_PROMPT,
    prompt: JSON.stringify({ problem, innovations }),
    output: Output.object({
      schema: z.object({
        reasons: z.array(
          z.object({
            id: z.string(),
            reason: z.string().min(1).max(220),
          }),
        ),
      }),
    }),
    temperature: 0.2,
    maxOutputTokens: 1800,
    maxRetries: 0,
    abortSignal: signal
      ? AbortSignal.any([signal, AbortSignal.timeout(6000)])
      : AbortSignal.timeout(6000),
  });
  const ids = new Set(innovations.map(({ id }) => id));
  return Object.fromEntries(
    output.reasons
      .filter(({ id, reason }) => ids.has(id) && reason.trim())
      .map(({ id, reason }) => [id, reason.trim()]),
  );
}
