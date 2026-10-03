import { NextResponse } from "next/server";
import { profileToProblem } from "@/lib/institutions/problem-text";
import { matchProblem } from "@/lib/match/service";
import { clientKey, createRateLimiter } from "@/lib/rate-limit";
import { institutionProfileSchema } from "@/lib/validators";

export const maxDuration = 30;

const CANDIDATE_COUNT = 3;
const allowRequest = createRateLimiter({ limit: 20, windowMs: 60_000 });

export async function POST(request: Request) {
  if (!allowRequest(clientKey(request))) {
    return NextResponse.json(
      { error: "Zbyt wiele zapytań. Spróbuj ponownie za minutę." },
      { status: 429, headers: { "Retry-After": "60" } },
    );
  }
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Nie udało się odczytać danych. Spróbuj wysłać je ponownie." },
      { status: 400 },
    );
  }

  const parsed = institutionProfileSchema
    .omit({ innovationId: true })
    .safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      {
        error:
          "Nie udało się odczytać opisu instytucji. Sprawdź formularz i spróbuj ponownie.",
        issues: parsed.error.issues.map(({ path, message }) => ({
          path,
          message,
        })),
      },
      { status: 400 },
    );
  }

  const { results, source } = await matchProblem({
    problem: profileToProblem(parsed.data),
    limit: CANDIDATE_COUNT,
  });
  return NextResponse.json(
    { candidates: results.slice(0, CANDIDATE_COUNT), source },
    { headers: { "X-Match-Source": source } },
  );
}
