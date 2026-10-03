import { matchResultSchema } from "@/lib/validators";
import type { MatchRequest, MatchResult } from "@/types";

export type MatchSource = "ai" | "mock" | "unknown";

export interface MatchResponse {
  results: MatchResult[];
  source: MatchSource;
}

export const GENERIC_MATCH_ERROR =
  "Nie udało się wyszukać rozwiązań. Spróbuj ponownie za chwilę.";

const matchResultsSchema = matchResultSchema.array();

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

  const parsed = matchResultsSchema.safeParse(body);
  if (!parsed.success) {
    throw new MatchApiError(GENERIC_MATCH_ERROR, response.status);
  }

  return { results: parsed.data, source: readSource(response.headers) };
}
