import { cache } from "react";
import { getCurrentUser, type CurrentUser } from "@/lib/auth/session";
import { createClient, hasSupabase } from "@/lib/supabase/server";

/**
 * - admin: signed-in ROPS administrator, full read and write.
 * - preview: ADMIN_PREVIEW=true for non-admins; read-only, published innovations and aggregates only.
 * - demo: Supabase is not configured; mocks with in-memory edits.
 * - denied: everyone else.
 */
export type AdminMode = "admin" | "preview" | "demo" | "denied";

export type AdminAccess = { mode: AdminMode; user: CurrentUser | null };

async function isAdmin(user: CurrentUser): Promise<boolean> {
  if (user.profile?.role === "admin") return true;
  try {
    const supabase = await createClient();
    if (!supabase) return false;
    const { data, error } = await supabase.rpc("is_admin");
    return !error && data === true;
  } catch {
    return false;
  }
}

export async function resolveAdminAccess(): Promise<AdminAccess> {
  if (!hasSupabase) return { mode: "demo", user: null };
  // A failed auth request counts as "not signed in", never as a crash.
  const user = await getCurrentUser().catch(() => null);
  if (user && (await isAdmin(user))) return { mode: "admin", user };
  if (process.env.ADMIN_PREVIEW === "true") return { mode: "preview", user };
  return { mode: "denied", user };
}

/** Deduplicated per request. Server actions must still call it and check the mode themselves. */
export const getAdminAccess = cache(resolveAdminAccess);

/** Modes that may change data: the real database for admins, the in-memory copy in demo. */
export function canWrite(mode: AdminMode): mode is "admin" | "demo" {
  return mode === "admin" || mode === "demo";
}

/** Modes that may see raw problem and idea texts. */
export function canModerate(mode: AdminMode): mode is "admin" | "demo" {
  return mode === "admin" || mode === "demo";
}
