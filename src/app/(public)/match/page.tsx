import { ShieldCheckIcon } from "@heroicons/react/20/solid";
import type { Metadata } from "next";
import { Suspense } from "react";
import {
  MatchExperience,
  MatchExperienceFromUrl,
} from "@/components/match/match-experience";

export const metadata: Metadata = {
  title: "Dopasuj innowację",
  description:
    "Opisz problem społeczny w swojej okolicy, a wskażemy sprawdzone innowacje społeczne, które mogą pomóc.",
};

export default function MatchPage() {
  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-8">
      <header className="flex flex-col gap-3">
        <h1 className="text-3xl font-bold tracking-tight text-balance sm:text-4xl">
          Dopasuj innowację
        </h1>
        <p className="max-w-2xl text-lg">
          Opisz problem społeczny własnymi słowami. Wyszukamy sprawdzone
          rozwiązania z bazy Małopolskiego Hubu Innowacji Społecznych i
          wyjaśnimy, dlaczego pasują.
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
