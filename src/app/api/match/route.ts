import { NextResponse } from "next/server";
import { matchProblem } from "@/lib/match/service";
import { allowMatchRequest } from "@/lib/match/rate-limit";
import { matchRequestSchema } from "@/lib/validators";

export const maxDuration = 30;

export async function POST(request: Request) {
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  if (!allowMatchRequest(ip)) {
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

  const parsed = matchRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      {
        error:
          "Nie udało się odczytać opisu lub kategorii. Sprawdź formularz i spróbuj ponownie.",
        issues: parsed.error.issues,
      },
      { status: 400 },
    );
  }

  const problem = parsed.data.problem.trim();
  if (problem.length < 3 || problem.length > 2000) {
    return NextResponse.json(
      { error: "Opis problemu musi mieć od 3 do 2000 znaków." },
      { status: 400 },
    );
  }
  const { results, noGoodMatch, source } = await matchProblem(
    {
      ...parsed.data,
      problem,
      limit: Math.max(1, Math.min(10, parsed.data.limit ?? 5)),
    },
    { hideWeak: true },
  );
  return NextResponse.json(
    { results, noGoodMatch },
    { headers: { "X-Match-Source": source } },
  );
}
