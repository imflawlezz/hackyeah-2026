import { timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { hasOpenAI } from "@/lib/ai/models";
import { backfillInnovations } from "@/lib/ai/backfill";
import { getCurrentUser, isAdmin } from "@/lib/auth/session";

const embedRequestSchema = z
  .object({
    ids: z.array(z.string().min(1)).max(500).optional(),
    all: z.boolean().optional(),
  })
  .strict();

function hasValidSecret(request: Request): boolean {
  const secret = process.env.EMBED_SECRET;
  const provided = request.headers.get("x-embed-secret");
  return Boolean(
    secret &&
    provided &&
    Buffer.byteLength(secret) === Buffer.byteLength(provided) &&
    timingSafeEqual(Buffer.from(secret), Buffer.from(provided)),
  );
}

export function GET() {
  return NextResponse.json(
    {
      error:
        "Nie można przygotować bazy z tego adresu. Skontaktuj się z administratorem.",
    },
    { status: 405, headers: { Allow: "POST" } },
  );
}

export async function POST(request: Request) {
  // Either the shared secret (scripts, cron) or a signed-in admin session.
  if (!hasValidSecret(request) && !isAdmin(await getCurrentUser())) {
    return NextResponse.json(
      {
        error:
          "Nie masz uprawnień do przygotowania bazy. Skontaktuj się z administratorem.",
      },
      { status: 401 },
    );
  }
  try {
    const admin = createAdminClient();
    if (!admin || !hasOpenAI) {
      return NextResponse.json(
        {
          error:
            "Usługa przygotowania bazy jest niedostępna. Skontaktuj się z administratorem.",
        },
        { status: 503 },
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
    const parsed = embedRequestSchema.safeParse(body);
    if (!parsed.success)
      return NextResponse.json(
        {
          error:
            "Nie udało się odczytać ustawień. Sprawdź dane i spróbuj ponownie.",
        },
        { status: 400 },
      );
    const count = await backfillInnovations(admin, parsed.data);
    return NextResponse.json({ count });
  } catch {
    console.warn("Innovation embedding backfill failed");
    return NextResponse.json(
      {
        error:
          "Nie udało się przygotować bazy do wyszukiwania. Spróbuj ponownie.",
      },
      { status: 503 },
    );
  }
}
