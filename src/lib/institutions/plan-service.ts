import { generatePlanDraft, type PlanDraft } from "@/lib/ai/middleman";
import { hasOpenAI } from "@/lib/ai/models";
import { BUDGET_BAND_RANGE } from "@/lib/institutions/labels";
import { buildTemplatePlan } from "@/lib/institutions/template-plan";
import { implementationPlanSchema } from "@/lib/validators";
import type {
  ImplementationPlan,
  Innovation,
  InstitutionProfile,
} from "@/types";

export const PLAN_TIMEOUT_MS = 20_000;
const MAX_ATTEMPTS = 2;
/**
 * One attempt takes roughly 10 to 14 s with gpt-4o-mini, so a retry only fits
 * the deadline when the first attempt ended early. Otherwise the template is
 * returned at once instead of making the user wait for a retry that cannot
 * finish.
 */
const RETRY_WINDOW_MS = 7_000;
/** How far the model's totals may be from the sum of its own cost rows. */
const TOTALS_TOLERANCE = 0.05;
/** Costs may exceed the stated budget a little before the draft is rejected. */
const BUDGET_HEADROOM = 1.25;

function sum(values: number[]): number {
  return values.reduce((total, value) => total + value, 0);
}

function roughlyEqual(stated: number, computed: number): boolean {
  return (
    Math.abs(stated - computed) <= Math.max(1, computed) * TOTALS_TOLERANCE
  );
}

/**
 * Turns a model draft into a plan, or names the first check it fails. Totals
 * are always recomputed from the cost rows; the model's own totals only decide
 * whether the draft is trusted.
 */
export function checkPlanDraft(
  draft: PlanDraft,
  profile: InstitutionProfile,
  innovation: Innovation,
): { ok: true; plan: ImplementationPlan } | { ok: false; reason: string } {
  const costs = draft.costs.map((row) => ({
    item: row.item,
    minPln: Math.round(row.minPln),
    maxPln: Math.round(row.maxPln),
    ...(row.note?.trim() ? { note: row.note.trim() } : {}),
  }));
  if (costs.some((row) => row.minPln < 0 || row.minPln > row.maxPln)) {
    return { ok: false, reason: "cost row range" };
  }
  const totalMinPln = sum(costs.map(({ minPln }) => minPln));
  const totalMaxPln = sum(costs.map(({ maxPln }) => maxPln));
  if (
    draft.totalMinPln > draft.totalMaxPln ||
    !roughlyEqual(draft.totalMinPln, totalMinPln) ||
    !roughlyEqual(draft.totalMaxPln, totalMaxPln)
  ) {
    return { ok: false, reason: "totals do not match cost rows" };
  }
  const budgetCeiling =
    BUDGET_BAND_RANGE[profile.budgetBand].max * (profile.timeline / 12);
  if (
    profile.budgetBand !== ">500k" &&
    totalMinPln > budgetCeiling * BUDGET_HEADROOM
  ) {
    return { ok: false, reason: "costs above the stated budget" };
  }

  // The schema rejects empty sections and blank strings.
  const parsed = implementationPlanSchema.safeParse({
    innovationId: innovation.id,
    title: draft.title,
    summary: draft.summary,
    whyItFits: draft.whyItFits,
    adaptations: draft.adaptations,
    steps: draft.steps.map((step) => ({
      ...step,
      weeks: Math.round(step.weeks),
    })),
    costs,
    totalMinPln,
    totalMaxPln,
    people: draft.people.map((person) => ({
      role: person.role,
      ...(person.fte && person.fte > 0 ? { fte: person.fte } : {}),
      ...(person.note?.trim() ? { note: person.note.trim() } : {}),
    })),
    partners: draft.partners,
    risks: draft.risks,
    kpis: draft.kpis,
    fundingOptions: draft.fundingOptions,
    assumptions: draft.assumptions,
    source: "ai",
  });
  if (!parsed.success) return { ok: false, reason: "schema" };
  return { ok: true, plan: parsed.data };
}

/**
 * The plan for one institution and one innovation. Never throws: without a
 * key, on error, on timeout or when the draft fails its checks twice, the
 * deterministic template is returned instead.
 */
export async function buildPlan(
  profile: InstitutionProfile,
  innovation: Innovation,
  requestSignal?: AbortSignal,
): Promise<ImplementationPlan> {
  if (!hasOpenAI) return buildTemplatePlan(profile, innovation);

  // One deadline for all attempts, so a retry cannot double the wait.
  const deadline = AbortSignal.timeout(PLAN_TIMEOUT_MS);
  const signal = requestSignal
    ? AbortSignal.any([requestSignal, deadline])
    : deadline;

  const started = Date.now();
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    try {
      const draft = await generatePlanDraft(profile, innovation, signal);
      const checked = checkPlanDraft(draft, profile, innovation);
      if (checked.ok) return checked.plan;
      console.warn("Plan draft rejected", { attempt, reason: checked.reason });
    } catch {
      console.warn("Plan generation failed", {
        attempt,
        cause: signal.aborted ? "timeout or abort" : "request failed",
      });
    }
    if (signal.aborted || Date.now() - started > RETRY_WINDOW_MS) break;
  }
  return buildTemplatePlan(profile, innovation);
}
