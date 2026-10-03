import type { Role } from "@/types";

export const ROLE_LABELS: Record<Role, string> = {
  resident: "Mieszkaniec lub organizacja",
  jst: "Samorząd (JST)",
  expert: "Ekspert",
  admin: "Administrator ROPS",
};

/** Roles a person may pick at sign-up. Admins are promoted manually. */
export const SIGNUP_ROLES = ["resident", "jst", "expert"] as const;
export type SignupRole = (typeof SIGNUP_ROLES)[number];

/**
 * Never trust a client-sent role: anything outside SIGNUP_ROLES, including
 * "admin", becomes "resident". Mirrors public.handle_new_user() in
 * supabase/migrations/0002_auth_profiles.sql.
 */
export function sanitizeSignupRole(value: unknown): SignupRole {
  return SIGNUP_ROLES.includes(value as SignupRole)
    ? (value as SignupRole)
    : "resident";
}
