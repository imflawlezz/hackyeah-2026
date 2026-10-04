import type { Metadata } from "next";
import { OpenTestsList } from "@/components/testing/open-tests-list";
import { getMySignupTestIds, listOpenTests } from "@/lib/data/testing";
import { hasSupabase } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Testuj innowacje",
  description:
    "Sprawdź nowe rozwiązania, zgłoś chęć udziału w testach i przekaż swoją opinię.",
};

export default async function TestPage() {
  const [tests, signedUpTestIds] = await Promise.all([
    listOpenTests(),
    getMySignupTestIds(),
  ]);

  return (
    <div className="flex flex-col gap-8">
      <h1 className="font-heading text-3xl font-bold text-balance sm:text-4xl">
        Testuj innowacje
      </h1>

      <OpenTestsList
        tests={tests}
        demo={!hasSupabase}
        signedUpTestIds={signedUpTestIds}
      />
    </div>
  );
}
