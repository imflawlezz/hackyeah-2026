import { ShieldCheckIcon } from "@heroicons/react/20/solid";
import type { Metadata } from "next";
import { Suspense } from "react";
import {
  MatchExperience,
  MatchExperienceFromUrl,
} from "@/components/match/match-experience";

export const metadata: Metadata = {
  title: "Znajdź rozwiązania",
  description:
    "Opisz potrzeby swojej okolicy i sprawdź propozycje z bazy innowacji społecznych.",
};

export default function MatchPage() {
  return (
    <div className="flex flex-col gap-8">
      <header className="flex flex-col gap-3">
        <h1 className="text-3xl font-bold text-balance sm:text-4xl">
          Znajdź rozwiązania
        </h1>
        <p className="max-w-2xl text-lg">
          Napisz, czego brakuje w Twojej okolicy. Porównamy opis z bazą
          innowacji społecznych. Sprawdź propozycje i oceń, które mogą pomóc.
        </p>
        <p className="flex max-w-2xl items-start gap-2 text-base text-muted-foreground">
          <ShieldCheckIcon
            aria-hidden="true"
            className="mt-0.5 size-5 shrink-0"
          />
          <span>
            Nie wpisuj imion, adresów ani numerów telefonu. Opis problemu
            zapisujemy bez danych osobowych, żeby ROPS widział, jakich rozwiązań
            brakuje.
          </span>
        </p>
      </header>

      {/* The fallback is the prerendered form; ?q= is read after hydration. */}
      <Suspense fallback={<MatchExperience />}>
        <MatchExperienceFromUrl />
      </Suspense>
    </div>
  );
}
