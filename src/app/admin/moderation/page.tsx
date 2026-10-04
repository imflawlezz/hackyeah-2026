import type { Metadata } from "next";
import { pageAccess } from "@/app/admin/access";
import { Moderation } from "@/components/admin/moderation";
import { AdminPageHeader, Notice } from "@/components/admin/page-header";
import { canModerate } from "@/lib/auth/admin";
import { getModerationQueue } from "@/lib/admin/repository";
import { toExcerpt } from "@/lib/admin/scrub";

export const metadata: Metadata = { title: "Moderacja" };

export default async function ModerationPage() {
  const access = await pageAccess();
  if (access.mode === "denied") return null;

  const header = (
    <AdminPageHeader
      title="Moderacja"
      description="Każda zmiana wymaga potwierdzenia."
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

  // The tab lives in ?tab= and Moderation reads it from the URL itself.
  const { data, notice } = await getModerationQueue(access);

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
      />
    </>
  );
}
