import Link from "next/link";

const FOOTER_LINKS = [
  { href: "/accessibility", label: "Deklaracja dostępności" },
  { href: "/knowledge", label: "Baza wiedzy" },
  { href: "/match", label: "Znajdź rozwiązania" },
] as const;

const linkClassName =
  "inline-flex min-h-11 items-center rounded-sm underline underline-offset-4 hover:decoration-2";

export function SiteFooter() {
  return (
    // The focus ring switches to the footer text colour to stay visible on navy.
    <footer className="border-t border-border bg-navy text-navy-foreground [--ring:var(--navy-foreground)] print:hidden">
      <div className="mx-auto grid w-full max-w-6xl gap-8 px-4 py-10 md:grid-cols-3">
        <div className="md:col-span-1">
          <p className="text-xl font-bold">HubMI.pl</p>
          <p className="mt-2">
            Pomysły dla mieszkańców, organizacji społecznych i gmin Małopolski.
            Sprawdź, co może pomóc w Twojej okolicy.
          </p>
        </div>

        <nav aria-label="Stopka">
          <ul className="flex flex-col gap-3">
            {FOOTER_LINKS.map((link) => (
              <li key={link.href}>
                <Link href={link.href} className={linkClassName}>
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div>
          <p className="font-semibold">Kontakt</p>
          <p className="mt-2">
            <a href="mailto:kontakt@hubmi.example" className={linkClassName}>
              kontakt@hubmi.example
            </a>
          </p>
        </div>
      </div>
      <div className="border-t border-navy-foreground/40">
        <p className="mx-auto w-full max-w-6xl px-4 py-4 text-sm">
          Prototyp przygotowany na HackYeah 2026. Dane w bazie są przykładowe.
        </p>
      </div>
    </footer>
  );
}
