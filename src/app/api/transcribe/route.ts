import { transcribeAudio } from "@/lib/ai/transcribe";
import { hasOpenAI } from "@/lib/ai/models";
import { clientIp, createRateLimiter } from "@/lib/rate-limit";
import { readAudio, UploadError } from "@/lib/voice/upload";

export const runtime = "nodejs";
export const maxDuration = 30;
const allow = createRateLimiter({ limit: 5, windowMs: 60_000 });
const globalAllow = createRateLimiter({ limit: 60, windowMs: 60_000 });
const failure =
  "Nie udało się rozpoznać mowy. Spróbuj ponownie lub wpisz tekst.";

export async function POST(request: Request) {
  const origin = request.headers.get("origin");
  if (origin && origin !== new URL(request.url).origin)
    return Response.json({ error: failure }, { status: 400 });
  if (!allow(clientIp(request)) || !globalAllow("all"))
    return Response.json(
      {
        error: "Zbyt wiele nagrań. Spróbuj ponownie za minutę lub wpisz tekst.",
      },
      { status: 429, headers: { "Retry-After": "60" } },
    );
  try {
    const file = await readAudio(request);
    if (!hasOpenAI)
      return Response.json(
        {
          error:
            "Wprowadzanie głosowe jest teraz niedostępne. Możesz wpisać tekst.",
        },
        { status: 503 },
      );
    const text = await transcribeAudio(file);
    return Response.json(
      { text },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    return Response.json(
      { error: failure },
      { status: error instanceof UploadError ? error.status : 503 },
    );
  }
}
