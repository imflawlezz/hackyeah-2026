import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { pageAccess } from "@/app/admin/access";
import { EmbeddingBadge, StatusBadge } from "@/components/admin/badges";
import { InnovationForm } from "@/components/admin/innovation-form";
import { AdminPageHeader, Notice } from "@/components/admin/page-header";
import { canWrite } from "@/lib/auth/admin";
import { getInnovation, listCategories } from "@/lib/admin/repository";

export const metadata: Metadata = { title: "Edycja innowacji" };

export default async function EditInnovationPage({
  params,
}: PageProps<"/admin/innovations/[id]/edit">) {
  const access = await pageAccess();
  if (access.mode === "denied") return null;
  if (!canWrite(access.mode)) {
    return <p>Edytować innowacje może tylko administrator ROPS.</p>;
  }
  const { id } = await params;
  const [{ data: innovation, notice }, categories] = await Promise.all([
    getInnovation(access, decodeURIComponent(id)),
    listCategories(access),
  ]);
  if (!innovation) notFound();

  return (
    <>
      <AdminPageHeader
        title="Edycja innowacji"
        description="Po zapisaniu przeliczymy wektor tej innowacji, żeby dopasowanie uwzględniało nowy opis."
      >
        <StatusBadge status={innovation.status} />
        <EmbeddingBadge ready={innovation.hasEmbedding} />
      </AdminPageHeader>
      {notice && <Notice>{notice}</Notice>}
      <InnovationForm innovation={innovation} categories={categories} />
    </>
  );
}
