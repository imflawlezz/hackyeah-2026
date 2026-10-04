import { z } from "zod";
import type { MatchTier } from "@/lib/match/score";
import { matchResultSchema } from "@/lib/validators";
import type { MatchRequest, MatchResult } from "@/types";

export type MatchSource = "ai" | "mock" | "unknown";

/** A result with the relevance tier decided by the server. */
export type TieredMatchResult = MatchResult & { tier: MatchTier };

export interface MatchResponse {
  /** Best first, so "match" results come before "related" ones. */
  results: TieredMatchResult[];
  /** True when no result is a "match"; the UI then invites a new challenge. */
  noGoodMatch: boolean;
  source: MatchSource;
}

export const GENERIC_MATCH_ERROR =
  "Nie udało się pobrać propozycji. Spróbuj ponownie za chwilę.";

const matchResponseSchema = z.object({
  results: matchResultSchema
    .extend({ tier: z.enum(["match", "related"]) })
    .array(),
  noGoodMatch: z.boolean(),
});

/** Error whose message is safe to show to the user (Polish, from the server or generic). */
export class MatchApiError extends Error {
  constructor(
    message: string,
    readonly status?: number,
  ) {
    super(message);
    this.name = "MatchApiError";
  }
}

function readSource(headers: Headers): MatchSource {
  const source = headers.get("X-Match-Source")?.trim().toLowerCase();
  return source === "ai" || source === "mock" ? source : "unknown";
}

async function readServerError(response: Response): Promise<string | null> {
  try {
    const body: unknown = await response.json();
    if (
      body &&
      typeof body === "object" &&
      "error" in body &&
      typeof body.error === "string" &&
      body.error.trim()
    ) {
      return body.error;
    }
  } catch {
    // Non-JSON error body: fall back to the generic message.
  }
  return null;
}

export async function fetchMatches(
  req: MatchRequest,
  signal?: AbortSignal,
): Promise<MatchResponse> {
  const response = await fetch("/api/match", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(req),
    signal,
  });

  if (!response.ok) {
    const message = await readServerError(response);
    throw new MatchApiError(message ?? GENERIC_MATCH_ERROR, response.status);
  }

  let body: unknown;
  try {
    body = await response.json();
  } catch {
    throw new MatchApiError(GENERIC_MATCH_ERROR, response.status);
  }

  const parsed = matchResponseSchema.safeParse(body);
  if (!parsed.success) {
    throw new MatchApiError(GENERIC_MATCH_ERROR, response.status);
  }

  return { ...parsed.data, source: readSource(response.headers) };
}
