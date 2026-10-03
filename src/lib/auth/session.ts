// Server only: reads the session cookies. Do not import from client components.
import { cache } from "react";
import { redirect } from "next/navigation";
import { loginPath } from "@/lib/auth/redirect";
import { createClient, hasSupabase } from "@/lib/supabase/server";
import type { Profile, Role } from "@/types";

export type CurrentUser = {
  id: string;
  email: string;
  profile: Profile | null;
};

type ProfileRow = {
  id: string;
  role: Role;
  display_name: string;
  municipality: string | null;
  created_at: string;
};

function toProfile(row: ProfileRow): Profile {
  return {
    id: row.id,
    role: row.role,
    displayName: row.display_name,
    ...(row.municipality ? { municipality: row.municipality } : {}),
    createdAt: row.created_at,
  };
}

/**
 * The signed-in user with their profile, or null. Verified against Supabase
 * Auth with getUser(), not read from the cookie alone. Null in demo mode
 * (no Supabase env). Cached per request.
 */
export const getCurrentUser = cache(async (): Promise<CurrentUser | null> => {
  const supabase = await createClient();
  if (!supabase) return null;

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from("profiles")
    .select("id, role, display_name, municipality, created_at")
    .eq("id", user.id)
    .maybeSingle<ProfileRow>();

  return {
    id: user.id,
    email: user.email ?? "",
    profile: data ? toProfile(data) : null,
  };
});

export function isAdmin(user: CurrentUser | null | undefined): boolean {
  return user?.profile?.role === "admin";
}

/** Redirects logged-out visitors to /login?next=…. No-op in demo mode. */
export async function requireUser(next?: string): Promise<CurrentUser | null> {
  if (!hasSupabase) return null;
  const user = await getCurrentUser();
  if (!user) redirect(loginPath(next));
  return user;
}

/**
 * Redirects logged-out visitors to /login?next=… and signed-in users with
 * another role to /?error=forbidden. No-op in demo mode.
 */
export async function requireRole(
  roles: Role | readonly Role[],
  next?: string,
): Promise<CurrentUser | null> {
  if (!hasSupabase) return null;
  const user = await getCurrentUser();
  if (!user) redirect(loginPath(next));
  const allowed = typeof roles === "string" ? [roles] : roles;
  if (!user.profile || !allowed.includes(user.profile.role)) {
    redirect("/?error=forbidden");
  }
  return user;
}
