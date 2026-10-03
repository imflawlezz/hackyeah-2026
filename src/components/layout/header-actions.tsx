"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { buttonVariants } from "@/components/ui/button";
import { isCurrentRoute } from "@/lib/navigation";
import { cn } from "@/lib/utils";

const ACTION_ITEMS = [
  { href: "/admin", label: "Panel administratora", variant: "outline" },
  { href: "/login", label: "Logowanie", variant: "default" },
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
      className={cn(buttonVariants({ variant: item.variant }))}
    >
      {item.label}
    </Link>
  ));
}
