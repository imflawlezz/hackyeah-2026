import { getCurrentUser } from "@/lib/auth/session";
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

export default async function MatchPage() {
  const signedIn = Boolean(await getCurrentUser());
  return (
    <div className="flex flex-col gap-8">
      <header className="flex flex-col gap-2.5">
        <h1 className="text-3xl font-bold text-balance sm:text-4xl">
          Znajdź rozwiązania
        </h1>
      </header>

      {/* The fallback preserves the session-aware form; ?q= is read after hydration. */}
      <Suspense fallback={<MatchExperience signedIn={signedIn} />}>
        <MatchExperienceFromUrl signedIn={signedIn} />
      </Suspense>
      <p className="flex max-w-2xl items-start gap-2 text-base text-muted-foreground">
        <ShieldCheckIcon
          aria-hidden="true"
          className="mt-0.5 size-5 shrink-0"
        />
        <span>
          Nie wpisuj danych osobowych, np. imion, adresów i numerów telefonu.
        </span>
      </p>
    </div>
  );
}
