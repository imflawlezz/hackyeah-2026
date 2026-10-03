import { generateText, Output } from "ai";
import { openai } from "@ai-sdk/openai";
import { NextResponse } from "next/server";
import { z } from "zod";
import { getGrantCall, isGrantCallOpen } from "@/lib/data/grant-calls";
import type { GrantCall, GrantDraftSection } from "@/types";
import { hasOpenAI, REASON_MODEL } from "@/lib/ai/models";
import { GRANT_DRAFT_SYSTEM_PROMPT } from "@/lib/ai/prompts";
import { withCopyStyle } from "@/lib/ai/style";
import {
  clip,
  hasPlaceholder,
  stripPlaceholders,
  templateGrantSections,
} from "@/lib/ideas/grant-template";
import { clientIp, createRateLimiter } from "@/lib/rate-limit";

export const maxDuration = 30;

const allowGrantDraft = createRateLimiter({ limit: 5, windowMs: 60_000 });

const canvasField = z.string().max(4000).optional();

const grantDraftBodySchema = z.object({
  callId: z.string().min(1).max(80),
  idea: z.object({
    title: z.string().max(200).optional(),
    summary: z.string().max(4000).optional(),
    targetGroup: z.string().max(500).optional(),
    municipality: z.string().max(200).optional(),
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
  }),
});

function jsonError(error: string, status: number) {
  return NextResponse.json(
    { error },
    status === 429 ? { status, headers: { "Retry-After": "60" } } : { status },
  );
}

export async function POST(request: Request) {
  if (!allowGrantDraft(clientIp(request))) {
    return jsonError("Za dużo zapytań. Spróbuj ponownie za minutę.", 429);
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonError("Treść żądania nie jest poprawnym JSON.", 400);
  }

  const parsed = grantDraftBodySchema.safeParse(body);
  if (!parsed.success) {
    return jsonError("Szkic wniosku nie spełnia wymagań formularza.", 400);
  }

  const call = await getGrantCall(parsed.data.callId);
  if (!call || !isGrantCallOpen(call)) {
    return jsonError("Ten nabór nie jest otwarty.", 400);
  }

  const template = templateGrantSections(parsed.data.idea, call);
  let source: "ai" | "template" = "template";
  let sections = template;

  if (hasOpenAI) {
    try {
      const { output } = await generateText({
        model: openai(REASON_MODEL),
        system: withCopyStyle(GRANT_DRAFT_SYSTEM_PROMPT),
        prompt: JSON.stringify({
          idea: parsed.data.idea,
          call: {
            title: call.title,
            startsAt: call.startsAt,
            endsAt: call.endsAt,
            maxAmountPln: call.maxAmountPln ?? null,
          },
          sections: call.requiredSections.map((section) => ({
            key: section.key,
            heading: section.heading,
            guidance: section.guidance,
            maxChars: section.maxChars,
          })),
        }),
        output: Output.object({
          schema: z.object({
            sections: z.array(
              z.object({
                key: z.string(),
                heading: z.string(),
                body: z.string(),
              }),
            ),
          }),
        }),
        temperature: 0.2,
        maxRetries: 0,
      });
      sections = alignSections(call, template, output.sections);
      source = "ai";
    } catch {
      console.warn("Grant draft fallback", {
        cause: "generation failed",
        summaryLength: parsed.data.idea.summary?.length ?? 0,
      });
      sections = template;
      source = "template";
    }
  }

  return NextResponse.json(
    { sections },
    { headers: { "X-Draft-Source": source } },
  );
}

function alignSections(
  call: GrantCall,
  template: GrantDraftSection[],
  generated: GrantDraftSection[],
): GrantDraftSection[] {
  return call.requiredSections.map((section) => {
    const match = generated.find((item) => item.key === section.key);
    const fallback =
      template.find((item) => item.key === section.key)?.body ?? "";
    // A section that is only a placeholder falls back to the template text.
    const cleaned = match ? stripPlaceholders(match.body) : "";
    const body =
      cleaned && !(hasPlaceholder(match!.body) && cleaned.length < 40)
        ? cleaned
        : fallback;
    return {
      key: section.key,
      heading: section.heading,
      body: clip(body, section.maxChars),
    };
  });
}
