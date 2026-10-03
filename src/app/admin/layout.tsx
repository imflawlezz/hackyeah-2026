import { requireRole } from "@/lib/auth/session";

// Defense in depth behind src/proxy.ts: every /admin page inherits this check.
export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireRole("admin", "/admin");
  return children;
}
