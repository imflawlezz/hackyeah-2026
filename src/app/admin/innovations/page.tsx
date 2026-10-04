import type { Metadata } from "next";
import Link from "next/link";
import { pageAccess } from "@/app/admin/access";
import { InnovationsTable } from "@/components/admin/innovations-table";
import { AdminPageHeader, Notice } from "@/components/admin/page-header";
import { RecomputeEmbeddingsButton } from "@/components/admin/recompute-button";
import { buttonVariants } from "@/components/ui/button";
import { canWrite } from "@/lib/auth/admin";
import { listInnovations } from "@/lib/admin/repository";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Innowacje" };

export default async function AdminInnovationsPage() {
  const access = await pageAccess();
  if (access.mode === "denied") return null;
  const { data: innovations, notice } = await listInnovations(access);
  const editable = canWrite(access.mode);
  const missing = innovations.filter(
    ({ hasEmbedding }) => !hasEmbedding,
  ).length;

  return (
    <>
      <AdminPageHeader
        title="Innowacje"
        description="Szkice i zarchiwizowane wpisy nie są widoczne publicznie."
      >
        {editable && (
          <>
            <Link
              href="/admin/innovations/new"
              className={cn(
                buttonVariants(),
                "h-auto min-h-11 max-w-full py-2 whitespace-normal",
              )}
            >
              Dodaj innowację
            </Link>
            <RecomputeEmbeddingsButton missing={missing} />
          </>
        )}
      </AdminPageHeader>
      {notice && <Notice>{notice}</Notice>}
      <InnovationsTable innovations={innovations} canEdit={editable} />
    </>
  );
}
