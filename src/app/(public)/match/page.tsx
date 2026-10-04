import { getCurrentUser } from "@/lib/auth/session";
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
      <h1 className="text-3xl font-bold text-balance sm:text-4xl">
        Znajdź rozwiązania
      </h1>

      {/* The fallback preserves the session-aware form; ?q= is read after hydration. */}
      <Suspense fallback={<MatchExperience signedIn={signedIn} />}>
        <MatchExperienceFromUrl signedIn={signedIn} />
      </Suspense>
    </div>
  );
}
