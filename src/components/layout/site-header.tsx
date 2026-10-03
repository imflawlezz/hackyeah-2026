"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_ITEMS = [
  { href: "/", label: "Strona główna" },
  { href: "/match", label: "Dopasuj innowację" },
  { href: "/knowledge", label: "Baza wiedzy" },
  { href: "/ideas", label: "Kreator pomysłów" },
  { href: "/test", label: "Testuj innowacje" },
  { href: "/messages", label: "Wiadomości" },
  { href: "/institutions", label: "Dla instytucji" },
  { href: "/admin", label: "Panel administratora" },
  { href: "/login", label: "Logowanie" },
] as const;

export function SiteHeader() {
  const pathname = usePathname();

  return (
    <header className="border-b border-slate-300 bg-white">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 px-4 py-4">
        <Link href="/" className="w-fit text-xl font-semibold text-slate-900">
          HubMI.pl
        </Link>
        <nav aria-label="Główna nawigacja">
          <ul className="flex flex-wrap gap-x-4 gap-y-2">
            {NAV_ITEMS.map((item) => {
              const current = pathname === item.href;
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    aria-current={current ? "page" : undefined}
                    className={`rounded-sm text-blue-800 underline underline-offset-4 hover:text-blue-950 ${
                      current ? "font-semibold" : "font-medium"
                    }`}
                  >
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      </div>
    </header>
  );
}
