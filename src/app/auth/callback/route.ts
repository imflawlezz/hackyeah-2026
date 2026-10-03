import { NextResponse } from "next/server";
import { safeNext } from "@/lib/auth/redirect";
import { createClient } from "@/lib/supabase/server";

// Target of the e-mail confirmation link: exchanges the one-time code for a
// session cookie, then sends the user on.
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = safeNext(searchParams.get("next"));

  if (code) {
    const supabase = await createClient();
    if (supabase) {
      const { error } = await supabase.auth.exchangeCodeForSession(code);
      if (!error) return NextResponse.redirect(new URL(next, origin));
    }
  }

  return NextResponse.redirect(new URL("/login?error=callback", origin));
}
