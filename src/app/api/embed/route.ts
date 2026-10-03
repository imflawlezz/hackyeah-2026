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
    { error: "Użyj metody POST." },
    { status: 405, headers: { Allow: "POST" } },
  );
}

export async function POST(request: Request) {
  // Either the shared secret (scripts, cron) or a signed-in admin session.
  if (!hasValidSecret(request) && !isAdmin(await getCurrentUser())) {
    return NextResponse.json({ error: "Brak uprawnień." }, { status: 401 });
  }
  try {
    const admin = createAdminClient();
    if (!admin || !hasOpenAI) {
      return NextResponse.json(
        { error: "Supabase lub OpenAI nie jest skonfigurowane." },
        { status: 503 },
      );
    }
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: "Treść żądania nie jest poprawnym JSON." },
        { status: 400 },
      );
    }
    const parsed = embedRequestSchema.safeParse(body);
    if (!parsed.success)
      return NextResponse.json(
        { error: "Niepoprawne żądanie obliczenia wektorów." },
        { status: 400 },
      );
    const count = await backfillInnovations(admin, parsed.data);
    return NextResponse.json({ count });
  } catch {
    console.warn("Innovation embedding backfill failed");
    return NextResponse.json(
      { error: "Nie udało się obliczyć wektorów innowacji. Spróbuj ponownie." },
      { status: 503 },
    );
  }
}
