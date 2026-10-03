import type { Metadata } from "next";
import { Suspense } from "react";
import {
  KnowledgeBrowser,
  KnowledgeBrowserFromUrl,
} from "@/components/knowledge/knowledge-browser";
import { getInnovations } from "@/lib/data/innovations";
import { materials } from "@/lib/mocks";

export const metadata: Metadata = {
  title: "Baza wiedzy",
  description:
    "Sprawdź wyzwania Małopolski, przykłady innowacji i materiały do pracy z mieszkańcami.",
};

// TODO(#27): admin-only "Trendy potrzeb" lives in the admin panel, not here.
export default async function KnowledgePage() {
  const innovations = await getInnovations();

  return (
    <div className="flex flex-col gap-8">
      <header className="flex max-w-3xl flex-col gap-3">
        <h1 className="font-heading text-3xl font-bold text-balance sm:text-4xl">
          Baza wiedzy
        </h1>
        <p className="text-lg">
          Sprawdź, jakie wyzwania społeczne ma Małopolska, jakie rozwiązania już
          działają i z jakich materiałów możesz skorzystać.
        </p>
      </header>

      {/* The fallback is the prerendered default tab; the query string is read after hydration. */}
      <Suspense
        fallback={
          <KnowledgeBrowser innovations={innovations} materials={materials} />
        }
      >
        <KnowledgeBrowserFromUrl
          innovations={innovations}
          materials={materials}
        />
      </Suspense>
    </div>
  );
}
