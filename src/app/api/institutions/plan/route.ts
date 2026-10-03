import { NextResponse } from "next/server";
import { z } from "zod";
import { getInnovationById } from "@/lib/data/innovations";
import { buildPlan } from "@/lib/institutions/plan-service";
import { clientKey, createRateLimiter } from "@/lib/rate-limit";
import { institutionProfileSchema } from "@/lib/validators";

// Generation is capped at 20 s; the rest is headroom for loading the innovation.
export const maxDuration = 30;

const allowRequest = createRateLimiter({ limit: 5, windowMs: 60_000 });

const planRequestSchema = z.object({
  profile: institutionProfileSchema,
  innovationId: z.string().min(1).max(100),
});

export async function POST(request: Request) {
  if (!allowRequest(clientKey(request))) {
    return NextResponse.json(
      {
        error:
          "Zbyt wiele planów w krótkim czasie. Spróbuj ponownie za minutę.",
      },
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

  const parsed = planRequestSchema.safeParse(body);
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

  const { profile, innovationId } = parsed.data;
  const innovation = await getInnovationById(innovationId);
  if (!innovation) {
    return NextResponse.json(
      { error: "Nie znaleźliśmy tej innowacji. Wybierz inną z listy." },
      { status: 404 },
    );
  }

  const plan = await buildPlan(profile, innovation, request.signal);
  return NextResponse.json(
    { plan, innovation },
    { headers: { "X-Plan-Source": plan.source } },
  );
}
