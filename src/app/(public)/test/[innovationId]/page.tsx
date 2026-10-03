import type { Metadata } from "next";
import Link from "next/link";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { notFound } from "next/navigation";
import { cache } from "react";
import { InnovationTesting } from "@/components/testing/innovation-testing";
import { Badge } from "@/components/ui/badge";
import { getCurrentUser } from "@/lib/auth/session";
import { getInnovationById } from "@/lib/data/innovations";
import {
  getFeedbackSummary,
  getMockFeedbackScores,
  getMySignupTestIds,
  getTestsForInnovation,
} from "@/lib/data/testing";
import { hasSupabase } from "@/lib/supabase/server";
import { cn } from "@/lib/utils";

type PageProps = { params: Promise<{ innovationId: string }> };

// generateMetadata and the page ask for the same row; cache() makes it one query.
const loadInnovation = cache(async (rawId: string) => {
  let id = rawId;
  try {
    id = decodeURIComponent(rawId);
  } catch {
    // Keep the raw value; it will simply not match anything.
  }
  return getInnovationById(id);
});

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { innovationId } = await params;
  const innovation = await loadInnovation(innovationId);
  if (!innovation) return { title: "Nie znaleźliśmy tej innowacji" };
  return {
    title: `Testuj: ${innovation.title}`,
    description: `Zgłoś się do testu albo oceń rozwiązanie „${innovation.title}”.`,
  };
}

const LINK_CLASSES =
  "rounded-sm text-primary underline underline-offset-4 hover:decoration-2";

export default async function InnovationTestPage({ params }: PageProps) {
  const { innovationId } = await params;
  const innovation = await loadInnovation(innovationId);
  if (!innovation) notFound();

  const [tests, summary, user, signedUpTestIds] = await Promise.all([
    getTestsForInnovation(innovation.id),
    getFeedbackSummary(innovation.id),
    getCurrentUser(),
    getMySignupTestIds(),
  ]);
  const encodedId = encodeURIComponent(innovation.id);
  const mode = !hasSupabase ? "demo" : user ? "signed-in" : "signed-out";

  return (
    <div className="flex flex-col gap-8">
      <Breadcrumbs
        items={[{ href: "/test", label: "Testuj innowacje" }]}
        current={innovation.title}
      />

      <header className="flex max-w-3xl flex-col items-start gap-4">
        <Badge
          variant="outline"
          className="h-auto rounded-md px-2.5 py-1 text-sm whitespace-normal"
        >
          {innovation.category}
        </Badge>
        <h1 className="font-heading text-3xl leading-tight font-bold text-balance break-words sm:text-4xl">
          {innovation.title}
        </h1>
        <p className="text-lg">
          <span className="font-semibold">Dla kogo:</span>{" "}
          {innovation.targetGroup}
        </p>
        <p>
          <Link
            href={`/knowledge/${encodedId}`}
            className={cn(LINK_CLASSES, "inline-flex min-h-11 items-center")}
          >
            Przeczytaj opis rozwiązania w bazie wiedzy
          </Link>
        </p>
      </header>

      <InnovationTesting
        innovationId={innovation.id}
        tests={tests}
        summary={summary}
        demoScores={hasSupabase ? [] : getMockFeedbackScores(innovation.id)}
        mode={mode}
        signedUpTestIds={signedUpTestIds}
        loginHref={`/login?next=${encodeURIComponent(`/test/${innovation.id}`)}`}
      />
    </div>
  );
}
