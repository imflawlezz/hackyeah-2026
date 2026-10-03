"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "@/app/(auth)/login/actions";
import { Button, buttonVariants } from "@/components/ui/button";
import { ROLE_LABELS } from "@/lib/auth/roles";
import { NotificationBell } from "@/components/notifications/notification-bell";
import { isCurrentRoute } from "@/lib/navigation";
import { cn } from "@/lib/utils";
import type { Role } from "@/types";

export type HeaderUser = { displayName: string; role: Role };

/**
 * Right-hand header actions. Rendered in the header and in the mobile menu.
 * `user` is read on the server in the root layout; `demo` means Supabase is
 * not configured and every module is open.
 */
export function HeaderActions({
  user,
  demo,
  onNavigate,
}: {
  user: HeaderUser | null;
  demo: boolean;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();

  const link = (
    href: string,
    label: string,
    variant: "default" | "outline",
  ) => (
    <Link
      href={href}
      aria-current={isCurrentRoute(pathname, href) ? "page" : undefined}
      onClick={onNavigate}
      className={cn(buttonVariants({ variant }))}
    >
      {label}
    </Link>
  );

  if (demo) {
    return (
      <>
        <NotificationBell />
        <p className="text-sm text-muted-foreground">Wersja demonstracyjna</p>
        {link("/admin", "Panel administratora", "outline")}
        {link("/login", "Zaloguj się", "outline")}
      </>
    );
  }

  if (!user) return link("/login", "Zaloguj się", "outline");

  return (
    <>
      <NotificationBell />
      <p className="flex flex-col">
        <span className="sr-only">Zalogowano jako </span>
        <span className="leading-tight font-semibold">{user.displayName}</span>
        <span
          data-slot="role-badge"
          className="w-fit rounded-sm border border-input px-2 text-sm text-muted-foreground"
        >
          {ROLE_LABELS[user.role]}
        </span>
      </p>
      {user.role === "admin"
        ? link("/admin", "Panel administratora", "outline")
        : null}
      <form action={signOut} className="contents">
        <Button type="submit" variant="outline">
          Wyloguj
        </Button>
      </form>
    </>
  );
}
