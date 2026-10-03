import { requireUser } from "@/lib/auth/session";

// Defense in depth behind src/proxy.ts: every /messages page inherits this check.
export default async function MessagesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireUser("/messages");
  return children;
}
