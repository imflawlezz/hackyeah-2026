"use server";

import { revalidatePath } from "next/cache";
import { after } from "next/server";
import { z } from "zod";
import { canWrite, getAdminAccess } from "@/lib/auth/admin";
import { hasOpenAI } from "@/lib/ai/models";
import { summarizeTrends } from "@/lib/admin/ai-summary";
import {
  innovationFormSchema,
  toInnovationInput,
} from "@/lib/admin/innovation-schema";
import {
  closeProblem,
  recomputeMissingEmbeddings,
  reembedInnovation,
  reviewIdea,
  saveInnovation,
  setInnovationStatus,
} from "@/lib/admin/mutations";
import { getTrendProblems } from "@/lib/admin/repository";
import {
  buildTrendReport,
  filterByPeriod,
  parsePeriod,
} from "@/lib/admin/trends";
import type { ActionResult } from "@/lib/admin/types";
import { createRateLimiter } from "@/lib/rate-limit";

const DENIED: ActionResult = {
  ok: false,
  message:
    "Tę zmianę może wprowadzić tylko administrator ROPS. Zaloguj się na konto administratora.",
};
const INVALID: ActionResult = {
  ok: false,
  message: "Niepoprawne dane. Odśwież stronę i spróbuj ponownie.",
};

const idSchema = z.string().trim().min(1).max(100);
const noteSchema = z.string().trim().max(1000);

function revalidateAdmin() {
  revalidatePath("/admin", "layout");
  revalidatePath("/knowledge");
}

/** Re-checked in every action: server actions are reachable by direct POST. */
async function writeAccess() {
  const access = await getAdminAccess();
  return canWrite(access.mode)
    ? (access as typeof access & { mode: "admin" | "demo" })
    : null;
}

export async function saveInnovationAction(
  id: string | null,
  values: unknown,
): Promise<ActionResult & { id?: string }> {
  const access = await writeAccess();
  if (!access) return DENIED;
  const parsedId =
    id === null
      ? { success: true as const, data: null }
      : idSchema.safeParse(id);
  const parsed = innovationFormSchema.safeParse(values);
  if (!parsedId.success || !parsed.success) return INVALID;
  const result = await saveInnovation(
    access,
    parsedId.data,
    toInnovationInput(parsed.data),
  );
  if (result.ok && result.id && access.mode === "admin") {
    const savedId = result.id;
    // Matching reads the vector, so refresh it after the response is sent.
    after(() => reembedInnovation(savedId));
  }
  if (result.ok) revalidateAdmin();
  return result;
}

export async function setInnovationStatusAction(
  id: string,
  status: unknown,
): Promise<ActionResult> {
  const access = await writeAccess();
  if (!access) return DENIED;
  const parsedId = idSchema.safeParse(id);
  const parsedStatus = z
    .enum(["draft", "published", "archived"])
    .safeParse(status);
  if (!parsedId.success || !parsedStatus.success) return INVALID;
  const result = await setInnovationStatus(
    access,
    parsedId.data,
    parsedStatus.data,
  );
  if (result.ok) revalidateAdmin();
  return result;
}

export async function recomputeEmbeddingsAction(): Promise<ActionResult> {
  const access = await writeAccess();
  if (!access) return DENIED;
  const result = await recomputeMissingEmbeddings(access);
  if (result.ok) revalidateAdmin();
  return result;
}

export async function reviewIdeaAction(
  id: string,
  note: string,
): Promise<ActionResult> {
  const access = await writeAccess();
  if (!access) return DENIED;
  const parsedId = idSchema.safeParse(id);
  const parsedNote = noteSchema.safeParse(note);
  if (!parsedId.success || !parsedNote.success) return INVALID;
  const result = await reviewIdea(access, parsedId.data, parsedNote.data);
  if (result.ok) revalidateAdmin();
  return result;
}

export async function closeProblemAction(
  id: string,
  note: string,
): Promise<ActionResult> {
  const access = await writeAccess();
  if (!access) return DENIED;
  const parsedId = idSchema.safeParse(id);
  const parsedNote = noteSchema.safeParse(note);
  if (!parsedId.success || !parsedNote.success) return INVALID;
  const result = await closeProblem(access, parsedId.data, parsedNote.data);
  if (result.ok) revalidateAdmin();
  return result;
}

const summaryLimiter = createRateLimiter({ limit: 5, windowMs: 10 * 60_000 });

export async function summarizeTrendsAction(
  period: unknown,
): Promise<ActionResult & { text?: string; source?: "ai" | "fallback" }> {
  const access = await getAdminAccess();
  // Excerpts of raw problem texts go to the model, so preview mode is excluded.
  if (!canWrite(access.mode)) return DENIED;
  if (!summaryLimiter(access.user?.id ?? "demo")) {
    return {
      ok: false,
      message:
        "Podsumowanie można przygotować 5 razy na 10 minut. Spróbuj ponownie później.",
    };
  }
  const parsedPeriod = parsePeriod(period);
  const { data } = await getTrendProblems(access);
  const now = new Date();
  const report = buildTrendReport(data, parsedPeriod, now);
  const recent = filterByPeriod(data, parsedPeriod, now).sort((a, b) =>
    b.createdAt.localeCompare(a.createdAt),
  );
  const summary = await summarizeTrends(report, recent, hasOpenAI);
  return { ok: true, message: "Podsumowanie jest gotowe.", ...summary };
}
