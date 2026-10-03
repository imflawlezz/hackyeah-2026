import type { Profile, Role } from "@/types";
import { createClient, hasSupabase } from "@/lib/supabase/server";

export type CurrentUser = {
  id: string;
  email: string;
  profile: Profile | null;
};

const ROLES: readonly Role[] = ["resident", "jst", "admin", "expert"];

function isRole(value: unknown): value is Role {
  return typeof value === "string" && ROLES.includes(value as Role);
}

// TODO(#12)
/** null when Supabase is not configured or nobody is signed in. Uses supabase.auth.getUser(). */
export async function getCurrentUser(): Promise<CurrentUser | null> {
  if (!hasSupabase) return null;
  try {
    const supabase = await createClient();
    if (!supabase) return null;
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) return null;
    const { data: row } = await supabase
      .from("profiles")
      .select("id, role, display_name, municipality, created_at")
      .eq("id", data.user.id)
      .maybeSingle();
    const profile =
      row && isRole(row.role)
        ? {
            id: String(row.id),
            role: row.role,
            displayName: String(row.display_name ?? ""),
            municipality: row.municipality
              ? String(row.municipality)
              : undefined,
            createdAt: String(row.created_at ?? ""),
          }
        : null;
    return {
      id: data.user.id,
      email: data.user.email ?? "",
      profile,
    };
  } catch {
    return null;
  }
}
