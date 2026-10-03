import type { Profile, Role } from "@/types";
import { createClient } from "@/lib/supabase/server";

// TODO(#12): replace with the session helper from the auth issue (same contract).
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

/** null when Supabase is not configured or nobody is signed in. Uses supabase.auth.getUser(). */
export async function getCurrentUser(): Promise<CurrentUser | null> {
  const supabase = await createClient();
  if (!supabase) return null;
  try {
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
      profile: data
        ? {
            id: data.id,
            role: data.role,
            displayName: data.display_name,
            municipality: data.municipality ?? undefined,
            createdAt: data.created_at,
          }
        : null,
    };
  } catch {
    return null;
  }
}
