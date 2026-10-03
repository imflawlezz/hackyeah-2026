import { NextResponse } from "next/server";
import { mockMatch } from "@/lib/mocks";
import { matchRequestSchema } from "@/lib/validators";

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Treść żądania nie jest poprawnym JSON." },
      { status: 400 },
    );
  }

  const parsed = matchRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "Żądanie nie spełnia kontraktu MatchRequest.",
        issues: parsed.error.issues,
      },
      { status: 400 },
    );
  }

  return NextResponse.json(mockMatch(parsed.data));
}
