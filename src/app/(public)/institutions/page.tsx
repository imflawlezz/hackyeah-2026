import type { Metadata } from "next";
import { InstitutionFlow } from "@/components/institutions/institution-flow";
import { getInnovationById } from "@/lib/data/innovations";

export const metadata: Metadata = {
  title: "Dla instytucji",
  description:
    "Opisz swoją gminę lub placówkę. Dobierzemy sprawdzone rozwiązanie i przygotujemy szkic planu wdrożenia.",
};

type PageProps = {
  searchParams: Promise<{ innovation?: string | string[] }>;
};

export default async function InstitutionsPage({ searchParams }: PageProps) {
  const { innovation: param } = await searchParams;
  const innovationId = (Array.isArray(param) ? param[0] : param)?.trim() ?? "";
  // /knowledge/[id] links here with ?innovation=<id>.
  const preselected = innovationId
    ? await getInnovationById(innovationId)
    : null;

  return (
    <div className="flex flex-col gap-8">
      <header className="flex max-w-3xl flex-col gap-2.5 print:hidden">
        <h1 className="text-3xl font-bold text-balance sm:text-4xl">
          Dla instytucji
        </h1>
      </header>

      {/* The key resets the flow when the preselected innovation changes. */}
      <InstitutionFlow
        key={preselected?.id ?? "none"}
        preselected={preselected}
        preselectedMissing={Boolean(innovationId) && !preselected}
      />
    </div>
  );
}
