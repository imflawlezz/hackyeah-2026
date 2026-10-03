import { z } from "zod";
import type { MatchSource } from "@/lib/api/match";
import {
  implementationPlanSchema,
  innovationSchema,
  matchResultSchema,
} from "@/lib/validators";
import type {
  ImplementationPlan,
  Innovation,
  InstitutionProfile,
  MatchResult,
} from "@/types";

export const GENERIC_CANDIDATES_ERROR =
  "Nie udało się dobrać rozwiązań. Spróbuj ponownie za chwilę.";
export const GENERIC_PLAN_ERROR =
  "Nie udało się przygotować planu. Spróbuj ponownie za chwilę.";

/** Error whose message is safe to show to the user (Polish, from the server or generic). */
export class InstitutionApiError extends Error {
  constructor(
    message: string,
    readonly status?: number,
  ) {
    super(message);
    this.name = "InstitutionApiError";
  }
}

const candidatesSchema = z.object({
  candidates: matchResultSchema.array(),
  source: z.enum(["ai", "mock"]).catch("mock"),
});

const planResponseSchema = z.object({
  plan: implementationPlanSchema,
  innovation: innovationSchema,
});

async function post<T>(
  url: string,
  payload: unknown,
  schema: z.ZodType<T>,
  genericError: string,
  signal?: AbortSignal,
): Promise<T> {
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
    signal,
  });
  let body: unknown = null;
  try {
    body = await response.json();
  } catch {
    // Non-JSON body: handled below as a generic failure.
  }
  if (!response.ok) {
    const message =
      body &&
      typeof body === "object" &&
      "error" in body &&
      typeof body.error === "string" &&
      body.error.trim()
        ? body.error
        : genericError;
    throw new InstitutionApiError(message, response.status);
  }
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    throw new InstitutionApiError(genericError, response.status);
  }
  return parsed.data;
}

export async function fetchCandidates(
  profile: InstitutionProfile,
  signal?: AbortSignal,
): Promise<{ candidates: MatchResult[]; source: MatchSource }> {
  // The server validates the profile without the innovation id.
  const { innovationId: _innovationId, ...rest } = profile;
  void _innovationId;
  return post(
    "/api/institutions/candidates",
    rest,
    candidatesSchema,
    GENERIC_CANDIDATES_ERROR,
    signal,
  );
}

export async function fetchPlan(
  profile: InstitutionProfile,
  innovationId: string,
  signal?: AbortSignal,
): Promise<{ plan: ImplementationPlan; innovation: Innovation }> {
  return post(
    "/api/institutions/plan",
    { profile, innovationId },
    planResponseSchema,
    GENERIC_PLAN_ERROR,
    signal,
  );
}
