import { connection } from "next/server";
import { getAdminAccess } from "@/lib/auth/admin";

/**
 * Admin pages render per request: demo mode reads no cookies, so without this
 * the pages would be prerendered and in-memory edits would never show up.
 */
export async function pageAccess() {
  await connection();
  return getAdminAccess();
}
