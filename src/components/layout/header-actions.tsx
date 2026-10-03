"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { isCurrentRoute } from "@/lib/navigation";

const ACTION_ITEMS = [
  { href: "/admin", label: "Panel administratora", variant: "outline" },
  { href: "/login", label: "Zaloguj się", variant: "default" },
] as const;

/** Right-hand header actions. Rendered in the header and in the mobile menu. */
export function HeaderActions({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();

  return ACTION_ITEMS.map((item) => (
    <Link
      key={item.href}
      href={item.href}
      aria-current={isCurrentRoute(pathname, item.href) ? "page" : undefined}
      onClick={onNavigate}
      className="inline-flex min-h-11 items-center rounded-sm px-3 py-2 text-primary underline underline-offset-4 hover:decoration-2 aria-[current=page]:font-semibold"
    >
      {item.label}
    </Link>
  ));
}
