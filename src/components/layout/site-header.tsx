"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bars3Icon } from "@heroicons/react/24/outline";
import { AccessibilityToolbar } from "@/components/layout/accessibility-toolbar";
import { HeaderActions } from "@/components/layout/header-actions";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { isCurrentRoute } from "@/lib/navigation";

const NAV_ITEMS = [
  { href: "/", label: "Strona główna" },
  { href: "/match", label: "Znajdź rozwiązania" },
  { href: "/knowledge", label: "Baza wiedzy" },
  { href: "/ideas", label: "Kreator pomysłów" },
  { href: "/test", label: "Testuj innowacje" },
  { href: "/messages", label: "Wiadomości" },
  { href: "/institutions", label: "Dla instytucji" },
] as const;

const MOBILE_NAV_ID = "mobile-nav";

function NavList({
  className,
  linkClassName,
  onNavigate,
}: {
  className: string;
  linkClassName: string;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();

  return (
    <ul className={className}>
      {NAV_ITEMS.map((item) => (
        <li key={item.href}>
          <Link
            href={item.href}
            aria-current={
              isCurrentRoute(pathname, item.href) ? "page" : undefined
            }
            onClick={onNavigate}
            className={`rounded-sm font-medium text-primary underline-offset-8 hover:underline aria-[current=page]:font-bold aria-[current=page]:text-accent-foreground aria-[current=page]:underline aria-[current=page]:decoration-2 ${linkClassName}`}
          >
            {item.label}
          </Link>
        </li>
      ))}
    </ul>
  );
}

export function SiteHeader() {
  const [menuOpen, setMenuOpen] = useState(false);
  const closeMenu = () => setMenuOpen(false);

  return (
    <header className="border-b border-border bg-background">
      <div className="border-b border-border bg-muted">
        <div className="mx-auto flex w-full max-w-6xl justify-end px-4 py-2">
          <AccessibilityToolbar />
        </div>
      </div>

      <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-x-6 gap-y-3 px-4 py-4">
        <Link href="/" className="flex flex-col rounded-md">
          <span className="font-heading text-2xl leading-tight font-bold text-heading">
            HubMI.pl
          </span>
          <span className="text-sm text-muted-foreground">
            Małopolski Hub Innowacji Społecznych
          </span>
        </Link>

        <div data-slot="header-actions" className="hidden gap-2 md:flex">
          <HeaderActions />
        </div>

        <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
          <SheetTrigger
            render={
              <Button
                variant="outline"
                className="md:hidden"
                aria-controls={MOBILE_NAV_ID}
              />
            }
          >
            <Bars3Icon aria-hidden="true" className="size-6" />
            Menu
          </SheetTrigger>
          <SheetContent
            id={MOBILE_NAV_ID}
            side="right"
            className="overflow-y-auto text-base data-[side=right]:w-full data-[side=right]:sm:max-w-sm"
          >
            <SheetHeader>
              <SheetTitle className="text-lg font-bold text-heading">
                Menu
              </SheetTitle>
              <SheetDescription className="sr-only">
                Nawigacja po serwisie HubMI.pl
              </SheetDescription>
            </SheetHeader>
            <nav aria-label="Główna nawigacja" className="px-4">
              <NavList
                className="flex flex-col gap-1"
                linkClassName="flex min-h-11 items-center px-3 py-2"
                onNavigate={closeMenu}
              />
            </nav>
            <div
              data-slot="header-actions"
              className="flex flex-col gap-2 border-t border-border p-4"
            >
              <HeaderActions onNavigate={closeMenu} />
            </div>
          </SheetContent>
        </Sheet>
      </div>

      <nav
        aria-label="Główna nawigacja"
        className="mx-auto hidden w-full max-w-6xl px-4 pb-3 md:block"
      >
        <NavList
          className="-mx-3 flex flex-wrap gap-x-1 gap-y-1"
          linkClassName="inline-flex min-h-11 items-center px-3 py-1"
        />
      </nav>
    </header>
  );
}
