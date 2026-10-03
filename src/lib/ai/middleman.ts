import { generateText, Output } from "ai";
import { openai } from "@ai-sdk/openai";
import { z } from "zod";
import type { Innovation, InstitutionProfile } from "@/types";
import { REASON_MODEL } from "./models";
import { MIDDLEMAN_SYSTEM_PROMPT } from "./prompts";

const text = z.string();
const pln = z.number();

/**
 * What the model returns. Structured output needs every key present, so
 * optional values are nullable here; the plan service turns the draft into an
 * ImplementationPlan after checking it.
 */
export const planDraftSchema = z.object({
  title: text,
  summary: text,
  whyItFits: text,
  adaptations: z.array(text),
  steps: z.array(
    z.object({
      title: text,
      description: text,
      weeks: z.number(),
      owner: text,
    }),
  ),
  costs: z.array(
    z.object({
      item: text,
      minPln: pln,
      maxPln: pln,
      note: text.nullable(),
    }),
  ),
  totalMinPln: pln,
  totalMaxPln: pln,
  people: z.array(
    z.object({
      role: text,
      fte: z.number().nullable(),
      note: text.nullable(),
    }),
  ),
  partners: z.array(z.object({ type: text, role: text })),
  risks: z.array(z.object({ risk: text, mitigation: text })),
  kpis: z.array(z.object({ indicator: text, target: text })),
  fundingOptions: z.array(text),
  assumptions: z.array(text),
});

export type PlanDraft = z.infer<typeof planDraftSchema>;

/** One generation attempt. Throws on timeout, abort or an unusable response. */
export async function generatePlanDraft(
  profile: InstitutionProfile,
  innovation: Innovation,
  signal: AbortSignal,
): Promise<PlanDraft> {
  const { output } = await generateText({
    model: openai(REASON_MODEL),
    system: MIDDLEMAN_SYSTEM_PROMPT,
    // Only what the plan may rely on; ids and links are left out.
    prompt: JSON.stringify({
      innovation: {
        title: innovation.title,
        summary: innovation.summary,
        description: innovation.description,
        category: innovation.category,
        targetGroup: innovation.targetGroup,
        tags: innovation.tags,
      },
      profile: {
        institutionType: profile.institutionType,
        municipalityType: profile.municipalityType,
        populationBand: profile.populationBand,
        budgetBand: profile.budgetBand,
        staffAvailable: profile.staffAvailable,
        targetGroup: profile.targetGroup,
        need: profile.need,
        constraints: profile.constraints,
        timeline: profile.timeline,
      },
    }),
    output: Output.object({ schema: planDraftSchema }),
    temperature: 0.3,
    maxOutputTokens: 2600,
    maxRetries: 0,
    abortSignal: signal,
  });
  return output;
}
