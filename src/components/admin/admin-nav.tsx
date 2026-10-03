"use client";

import {
  ChartBarIcon,
  ClipboardDocumentCheckIcon,
  RectangleStackIcon,
  Squares2X2Icon,
} from "@heroicons/react/24/outline";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const ITEMS = [
  { href: "/admin", label: "Przegląd", icon: Squares2X2Icon, exact: true },
  { href: "/admin/innovations", label: "Innowacje", icon: RectangleStackIcon },
  {
    href: "/admin/moderation",
    label: "Moderacja",
    icon: ClipboardDocumentCheckIcon,
  },
  { href: "/admin/trends", label: "Trendy potrzeb", icon: ChartBarIcon },
] as const;

function isCurrent(pathname: string, href: string, exact = false) {
  return exact
    ? pathname === href
    : pathname === href || pathname.startsWith(`${href}/`);
}

export function AdminNav() {
  const pathname = usePathname();

  return (
    <nav aria-label="Panel administratora">
      <ul className="flex flex-wrap gap-2 lg:flex-col lg:gap-1">
        {ITEMS.map((item) => {
          const current = isCurrent(
            pathname,
            item.href,
            "exact" in item && item.exact,
          );
          const Icon = item.icon;
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                aria-current={current ? "page" : undefined}
                className={cn(
                  "flex min-h-11 items-center gap-2 rounded-md border px-3 py-2 text-base font-semibold transition-colors",
                  current
                    ? "border-primary bg-accent text-accent-foreground"
                    : "border-transparent text-foreground hover:border-border hover:bg-muted",
                )}
              >
                <Icon aria-hidden="true" className="size-6 shrink-0" />
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
