import { createClient, hasSupabase } from "@/lib/supabase/server";
import type { Profile } from "@/types";

export type CurrentUser = {
  id: string;
  email: string;
  profile: Profile | null;
};

// TODO(#12): the auth issue owns this file; this is the agreed contract so
// other modules can be built before sign-in exists.
/** null when Supabase is not configured or nobody is signed in. Uses supabase.auth.getUser(). */
export async function getCurrentUser(): Promise<CurrentUser | null> {
  if (!hasSupabase) return null;
  const client = await createClient();
  if (!client) return null;

  try {
    const { data, error } = await client.auth.getUser();
    if (error || !data.user) return null;
    const { user } = data;

    const { data: row } = await client
      .from("profiles")
      .select("id, role, display_name, municipality, created_at")
      .eq("id", user.id)
      .maybeSingle();

    return {
      id: user.id,
      email: user.email ?? "",
      profile: row
        ? {
            id: row.id,
            role: row.role,
            displayName: row.display_name,
            municipality: row.municipality ?? undefined,
            createdAt: row.created_at,
          }
        : null,
    };
  } catch {
    console.warn("Current user unavailable", { cause: "auth request failed" });
    return null;
  }
}
