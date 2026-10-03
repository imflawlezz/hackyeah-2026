import type { Metadata } from "next";
import { pageAccess } from "@/app/admin/access";
import { Moderation, type ModerationTab } from "@/components/admin/moderation";
import { AdminPageHeader, Notice } from "@/components/admin/page-header";
import { canModerate } from "@/lib/auth/admin";
import { getModerationQueue } from "@/lib/admin/repository";
import { toExcerpt } from "@/lib/admin/scrub";

export const metadata: Metadata = { title: "Moderacja" };

function parseTab(value: unknown): ModerationTab {
  return value === "problems" || value === "drafts" ? value : "ideas";
}

export default async function ModerationPage({
  searchParams,
}: PageProps<"/admin/moderation">) {
  const access = await pageAccess();
  if (access.mode === "denied") return null;

  const header = (
    <AdminPageHeader
      title="Moderacja"
      description="Przejrzyj pomysły mieszkańców, nowe zgłoszenia problemów i szkice innowacji. Każda zmiana wymaga potwierdzenia."
    />
  );
  if (!canModerate(access.mode)) {
    return (
      <>
        {header}
        <p>
          Treść pomysłów i zgłoszeń widzą tylko administratorzy ROPS. W trybie
          podglądu zobaczysz zbiorcze dane w zakładce Trendy potrzeb.
        </p>
      </>
    );
  }

  const [{ data, notice }, { tab }] = await Promise.all([
    getModerationQueue(access),
    searchParams,
  ]);

  return (
    <>
      {header}
      {notice && <Notice>{notice}</Notice>}
      <Moderation
        ideas={data.ideas}
        problems={data.problems.map((problem) => ({
          ...problem,
          excerpt: toExcerpt(problem.description, 600),
        }))}
        drafts={data.drafts}
        initialTab={parseTab(tab)}
      />
    </>
  );
}
