import type { Metadata } from "next";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Nie znaleziono strony",
};

export default function NotFound() {
  return (
    <div className="flex max-w-2xl flex-col items-start gap-4">
      <h1 className="font-heading text-3xl font-bold text-balance">
        Nie znaleźliśmy tej strony
      </h1>
      <p className="text-lg">Adres może być nieaktualny lub zawierać błąd.</p>
      <nav aria-label="Przydatne strony" className="w-full">
        <ul className="flex flex-wrap items-center gap-x-6 gap-y-3">
          <li>
            <Link
              href="/"
              className={cn(
                buttonVariants(),
                "h-auto min-h-11 px-4 py-2 text-base whitespace-normal",
              )}
            >
              Przejdź do strony głównej
            </Link>
          </li>
          <li>
            <Link
              href="/match"
              className={cn(
                buttonVariants({ variant: "link" }),
                "h-auto min-h-11 px-0 text-base whitespace-normal underline",
              )}
            >
              Znajdź rozwiązania
            </Link>
          </li>
          <li>
            <Link
              href="/knowledge"
              className={cn(
                buttonVariants({ variant: "link" }),
                "h-auto min-h-11 px-0 text-base whitespace-normal underline",
              )}
            >
              Baza wiedzy
            </Link>
          </li>
        </ul>
      </nav>
    </div>
  );
}
