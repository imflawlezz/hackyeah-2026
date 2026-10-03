import { createTextStreamResponse, streamText, toTextStream } from "ai";
import { openai } from "@ai-sdk/openai";
import { NextResponse } from "next/server";
import { z } from "zod";
import { fallbackAssistantReply } from "@/lib/ai/assistant-fallback";
import { hasOpenAI, REASON_MODEL } from "@/lib/ai/models";
import { ASSISTANT_SYSTEM_PROMPT } from "@/lib/ai/prompts";
import { withCopyStyle } from "@/lib/ai/style";
import { matchProblem } from "@/lib/match/service";
import { clientIp, createRateLimiter } from "@/lib/rate-limit";

export const maxDuration = 30;

const allowAssistant = createRateLimiter({ limit: 15, windowMs: 60_000 });

const canvasField = z.string().max(2000).optional();
const ideaContextSchema = z.object({
  title: z.string().max(200).optional(),
  summary: z.string().max(2000).optional(),
  targetGroup: z.string().max(500).optional(),
  municipality: z.string().max(200).optional(),
  stage: z.enum(["idea", "prototype", "pilot"]).optional(),
  canvas: z
    .object({
      problem: canvasField,
      solution: canvasField,
      novelty: canvasField,
      resources: canvasField,
      partners: canvasField,
      risks: canvasField,
      successMeasures: canvasField,
    })
    .optional(),
});

const assistantBodySchema = z.object({
  messages: z
    .array(
      z.object({
        role: z.enum(["user", "assistant"]),
        content: z.string().max(2000),
      }),
    )
    .min(1)
    .max(12),
  context: z.object({ idea: ideaContextSchema.optional() }).optional(),
});

function textResponse(text: string, source: "ai" | "fallback") {
  const chunks = text.match(/\S+\s*/g) ?? [text];
  return createTextStreamResponse({
    headers: { "X-Assistant-Source": source },
    stream: new ReadableStream<string>({
      start(controller) {
        for (const chunk of chunks) controller.enqueue(chunk);
        controller.close();
      },
    }),
  });
}

export function GET() {
  return NextResponse.json(
    { error: "Ta ścieżka przyjmuje tylko POST." },
    { status: 405, headers: { Allow: "POST" } },
  );
}

export async function POST(request: Request) {
  if (!allowAssistant(clientIp(request))) {
    return NextResponse.json(
      { error: "Za dużo zapytań. Spróbuj ponownie za minutę." },
      { status: 429, headers: { "Retry-After": "60" } },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Treść żądania nie jest poprawnym JSON." },
      { status: 400 },
    );
  }

  const parsed = assistantBodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Wiadomość jest za długa albo jest ich za dużo." },
      { status: 400 },
    );
  }

  const messages = parsed.data.messages.map((message) => ({
    role: message.role,
    content: message.content.trim(),
  }));
  const lastUser = [...messages]
    .reverse()
    .find((message) => message.role === "user");
  if (!lastUser?.content) {
    return NextResponse.json(
      { error: "Wpisz pytanie do asystenta." },
      { status: 400 },
    );
  }

  const idea = parsed.data.context?.idea;
  const problem = idea?.summary?.trim() || lastUser.content;
  const { results } = await matchProblem({ problem, limit: 3 });
  const similar = results.slice(0, 3).map((result) => ({
    title: result.innovation.title,
    category: result.innovation.category,
    sentence: result.innovation.description.split(/(?<=\.)\s/)[0] ?? "",
  }));

  if (!hasOpenAI) {
    return textResponse(
      fallbackAssistantReply(
        idea,
        similar.map((item) => item.title),
      ),
      "fallback",
    );
  }

  try {
    const result = streamText({
      model: openai(REASON_MODEL),
      system: withCopyStyle(
        `${ASSISTANT_SYSTEM_PROMPT}\n\nPodobne innowacje (dane):\n${JSON.stringify(similar)}\n\nFiszka pomysłu (dane):\n${JSON.stringify(idea ?? {})}`,
      ),
      messages,
      temperature: 0.4,
      maxRetries: 0,
      abortSignal: request.signal,
    });
    return createTextStreamResponse({
      headers: { "X-Assistant-Source": "ai" },
      stream: toTextStream({ stream: result.stream }),
    });
  } catch {
    console.warn("Assistant fallback", {
      cause: "stream failed",
      messageLength: lastUser.content.length,
    });
    return textResponse(
      fallbackAssistantReply(
        idea,
        similar.map((item) => item.title),
      ),
      "fallback",
    );
  }
}
