import type { Metadata } from "next";
import { pageAccess } from "@/app/admin/access";
import { InnovationForm } from "@/components/admin/innovation-form";
import { AdminPageHeader } from "@/components/admin/page-header";
import { canWrite } from "@/lib/auth/admin";
import { listCategories } from "@/lib/admin/repository";

export const metadata: Metadata = { title: "Nowa innowacja" };

export default async function NewInnovationPage() {
  const access = await pageAccess();
  if (access.mode === "denied") return null;
  if (!canWrite(access.mode)) {
    return <p>Dodawać innowacje może tylko administrator ROPS.</p>;
  }
  const categories = await listCategories(access);

  return (
    <>
      <AdminPageHeader
        title="Nowa innowacja"
        description="Nowa innowacja zaczyna jako szkic. Opublikuj ją, gdy opis i dane kontaktowe są sprawdzone."
      />
      <InnovationForm innovation={null} categories={categories} />
    </>
  );
}
