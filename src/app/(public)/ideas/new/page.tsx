import type { Metadata } from "next";
import { IdeaWizard, type WizardDraft } from "@/components/ideas/idea-wizard";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { getCurrentUser } from "@/lib/auth/session";
import { getActiveGrantCall } from "@/lib/data/grant-calls";
import { getIdea } from "@/lib/data/ideas";
import { ideaToDraftValues } from "@/lib/ideas/draft";

export const metadata: Metadata = {
  title: "Nowy pomysł",
  description: "Uzupełnij kanwę innowacji krok po kroku.",
};

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default async function NewIdeaPage({
  searchParams,
}: {
  searchParams: Promise<{ draft?: string | string[] }>;
}) {
  const { draft } = await searchParams;
  const draftId = typeof draft === "string" ? draft : undefined;
  const [user, call] = await Promise.all([
    getCurrentUser(),
    getActiveGrantCall(),
  ]);

  // Only the author's own database draft can be edited here.
  let initialDraft: WizardDraft | undefined;
  if (user && draftId && UUID.test(draftId)) {
    const idea = await getIdea(draftId);
    if (idea && idea.status === "draft" && idea.authorId === user.id) {
      initialDraft = { id: idea.id, values: ideaToDraftValues(idea) };
    }
  }
  const localDraftId = draftId?.startsWith("local-") ? draftId : undefined;
  const editing = Boolean(initialDraft || localDraftId);

  const title = editing ? "Edytuj szkic pomysłu" : "Dodaj pomysł";

  return (
    <div className="flex flex-col gap-6">
      <Breadcrumbs
        items={[{ href: "/ideas", label: "Kreator pomysłów" }]}
        current={title}
      />
      <h1 className="text-3xl text-heading">{title}</h1>
      <IdeaWizard
        // A fresh instance per draft, so a new idea never inherits old state.
        key={initialDraft?.id ?? localDraftId ?? "new"}
        call={call}
        signedIn={Boolean(user)}
        initialDraft={initialDraft}
        localDraftId={localDraftId}
      />
    </div>
  );
}
