import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { isAdminPreviewPath, requiredAccess } from "@/lib/auth/access";
import { loginPath } from "@/lib/auth/redirect";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export async function proxy(request: NextRequest) {
  // Demo mode: no Supabase, every module is open.
  if (!url || !anonKey) return NextResponse.next();

  let response = NextResponse.next({ request });

  const supabase = createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        for (const { name, value } of cookiesToSet) {
          request.cookies.set(name, value);
        }
        response = NextResponse.next({ request });
        for (const { name, value, options } of cookiesToSet) {
          response.cookies.set(name, value, options);
        }
      },
    },
  });

  // getUser() verifies the token with Supabase Auth and refreshes an expired
  // session, which is what writes the new cookies above.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname, search } = request.nextUrl;
  const access = requiredAccess(pathname);
  if (access === "public") return response;

  // ADMIN_PREVIEW lets the jury see the read-only panel without an account.
  // The admin layout decides the mode; server actions re-check admin rights.
  if (
    access === "admin" &&
    process.env.ADMIN_PREVIEW === "true" &&
    isAdminPreviewPath(pathname)
  ) {
    return response;
  }

  // Redirects keep any refreshed session cookies.
  const redirectTo = (path: string) => {
    const redirect = NextResponse.redirect(new URL(path, request.url));
    for (const cookie of response.cookies.getAll()) {
      redirect.cookies.set(cookie);
    }
    return redirect;
  };

  if (!user) return redirectTo(loginPath(`${pathname}${search}`));

  if (access === "admin") {
    // RLS lets a user read only their own profile row.
    const { data } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .maybeSingle<{ role: string }>();
    if (data?.role !== "admin") return redirectTo("/?error=forbidden");
  }

  return response;
}

export const config = {
  matcher: [
    // Everything except API routes, Next.js internals and static files.
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
