import { timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { hasOpenAI } from "@/lib/ai/models";
import { backfillInnovations } from "@/lib/ai/backfill";

const embedRequestSchema = z
  .object({
    ids: z.array(z.string().min(1)).max(500).optional(),
    all: z.boolean().optional(),
  })
  .strict();

export function GET() {
  return NextResponse.json(
    { error: "Użyj metody POST." },
    { status: 405, headers: { Allow: "POST" } },
  );
}

export async function POST(request: Request) {
  // TODO(#12): replace the secret with an admin-role check once auth lands.
  const secret = process.env.EMBED_SECRET;
  const provided = request.headers.get("x-embed-secret");
  if (
    !secret ||
    !provided ||
    Buffer.byteLength(secret) !== Buffer.byteLength(provided) ||
    !timingSafeEqual(Buffer.from(secret), Buffer.from(provided))
  ) {
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
