import Link from "next/link";

// Design System Gov.pl footer: a horizontal list of 7–14 links including the
// accessibility statement, the RODO clause and the cookie policy, a copyright
// line and the owner's address under "ADRES".
const FOOTER_LINKS = [
  { href: "/accessibility", label: "Deklaracja dostępności" },
  { href: "/privacy", label: "Klauzula informacyjna RODO" },
  { href: "/cookies", label: "Polityka cookies" },
  { href: "/match", label: "Znajdź rozwiązania" },
  { href: "/knowledge", label: "Baza wiedzy" },
  { href: "/ideas", label: "Kreator pomysłów" },
  { href: "/test", label: "Testuj innowacje" },
  { href: "/institutions", label: "Dla instytucji" },
] as const;

const linkClassName =
  "inline-flex min-h-11 items-center rounded-sm underline underline-offset-4 hover:decoration-2";

export function SiteFooter() {
  return (
    // The focus ring switches to the footer text colour to stay visible on navy.
    <footer className="border-t border-border bg-navy text-navy-foreground [--ring:var(--navy-foreground)] print:hidden">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-10">
        <nav aria-label="Stopka">
          <ul className="flex flex-wrap gap-x-6 gap-y-1">
            {FOOTER_LINKS.map((link) => (
              <li key={link.href}>
                <Link href={link.href} className={linkClassName}>
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="grid gap-8 md:grid-cols-2">
          <div>
            <h2 className="text-base font-bold text-navy-foreground">ADRES</h2>
            {/* TODO(ROPS): the owner confirms the postal address before launch. */}
            <address className="mt-2 not-italic">
              Regionalny Ośrodek Polityki Społecznej w Krakowie
              <br />
              Adres siedziby uzupełnimy po potwierdzeniu przez ROPS.
            </address>
          </div>
          <div>
            <h2 className="text-base font-bold text-navy-foreground">
              Kontakt
            </h2>
            <p className="mt-2">
              <a href="mailto:kontakt@hubmi.example" className={linkClassName}>
                kontakt@hubmi.example
              </a>
            </p>
          </div>
        </div>
      </div>
      <div className="border-t border-navy-foreground/40">
        <p className="mx-auto w-full max-w-6xl px-4 py-4 text-sm">
          © 2026 HubMI.pl. Prototyp przygotowany na HackYeah 2026. Dane w bazie
          są przykładowe.
        </p>
      </div>
    </footer>
  );
}
