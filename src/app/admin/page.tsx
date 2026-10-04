import type { Metadata } from "next";
import Link from "next/link";
import { pageAccess } from "@/app/admin/access";
import { AdminPageHeader, Notice } from "@/components/admin/page-header";
import { getOverview, type Overview } from "@/lib/admin/repository";
import { reportsText } from "@/lib/admin/summary";

export const metadata: Metadata = { title: "Przegląd" };

type Kpi = { label: string; value: number | null; hint: string };

function kpis(overview: Overview): Kpi[] {
  return [
    {
      label: "Nowe zgłoszenia problemów (7 dni)",
      value: overview.newProblems7d,
      hint: "Opisy wpisane w wyszukiwarce /match.",
    },
    {
      label: "Pomysły czekające na przegląd",
      value: overview.submittedIdeas,
      hint: "Status „wysłany”.",
    },
    {
      label: "Opublikowane innowacje",
      value: overview.published,
      hint: "Widoczne w bazie wiedzy i w dopasowaniu.",
    },
    {
      label: "Szkice innowacji",
      value: overview.drafts,
      hint: "Niewidoczne publicznie.",
    },
    {
      label: "Innowacje bez wektora",
      value: overview.withoutEmbedding,
      hint: "Nie biorą udziału w dopasowaniu AI.",
    },
    {
      label: "Otwarte testy innowacji",
      value: overview.openTests,
      hint: "Testy, na które mieszkańcy mogą się zapisać na stronie /test.",
    },
  ];
}

type Attention = { text: string; href: string; link: string };

function attention(overview: Overview, canModerate: boolean): Attention[] {
  const items: Attention[] = [];
  if (overview.withoutEmbedding)
    items.push({
      text: `Innowacje bez wektora: ${overview.withoutEmbedding}. Nie pojawiają się w dopasowaniu AI.`,
      href: "/admin/innovations",
      link: canModerate ? "Przelicz wektory" : "Zobacz innowacje",
    });
  if (canModerate && overview.submittedIdeas)
    items.push({
      text: `Pomysły czekające na przegląd: ${overview.submittedIdeas}.`,
      href: "/admin/moderation",
      link: "Przejrzyj pomysły",
    });
  if (canModerate && overview.drafts)
    items.push({
      text: `Szkice innowacji do decyzji: ${overview.drafts}.`,
      href: "/admin/moderation?tab=drafts",
      link: "Zobacz szkice",
    });
  if (overview.unmetProblems7d)
    items.push({
      text: `W ostatnim tygodniu ${reportsText(overview.unmetProblems7d)} bez dobrego rozwiązania.`,
      href: "/admin/trends?period=30",
      link: "Zobacz trendy potrzeb",
    });
  return items;
}

export default async function AdminOverviewPage() {
  const access = await pageAccess();
  if (access.mode === "denied") return null;
  const { data: overview, notice } = await getOverview(access);
  const items = attention(overview, access.mode !== "preview");

  return (
    <>
      <AdminPageHeader title="Przegląd" />
      {notice && <Notice>{notice}</Notice>}

      <section aria-labelledby="kpi-heading" className="flex flex-col gap-2.5">
        <h2 id="kpi-heading" className="text-xl font-semibold">
          Liczby
        </h2>
        <dl className="divide-y divide-border border-y border-border">
          {kpis(overview).map((kpi) => (
            <div
              key={kpi.label}
              className="grid gap-x-6 gap-y-1 py-2.5 sm:grid-cols-[minmax(0,1fr)_6rem]"
            >
              <dt className="flex flex-col">
                <span className="font-semibold">{kpi.label}</span>
                <span className="text-base text-muted-foreground">
                  {kpi.hint}
                </span>
              </dt>
              <dd className="text-2xl font-semibold tabular-nums sm:text-right">
                {kpi.value ?? (
                  <span className="text-base font-normal text-muted-foreground">
                    brak danych
                  </span>
                )}
              </dd>
            </div>
          ))}
        </dl>
      </section>

      <section
        aria-labelledby="attention-heading"
        className="flex flex-col gap-2.5"
      >
        <h2 id="attention-heading" className="text-xl font-semibold">
          Wymaga uwagi
        </h2>
        {items.length ? (
          <ul className="flex flex-col gap-2">
            {items.map((item) => (
              <li
                key={item.href}
                className="flex flex-col gap-2 rounded-md border border-border px-4 py-2.5 sm:flex-row sm:items-center sm:justify-between"
              >
                <span>{item.text}</span>
                <Link
                  href={item.href}
                  className="inline-flex min-h-11 shrink-0 items-center gap-1 rounded-sm text-primary underline underline-offset-4 hover:no-underline"
                >
                  {item.link}
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <p>Nic nie czeka na decyzję.</p>
        )}
      </section>
    </>
  );
}
