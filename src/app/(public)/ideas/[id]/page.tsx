import type { Metadata } from "next";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { GrantDraftPanel } from "@/components/ideas/grant-draft-panel";
import { IdeaArticle } from "@/components/ideas/idea-article";
import { IdeaWorkspace } from "@/components/ideas/idea-workspace";
import { LocalIdeaPage } from "@/components/ideas/local-idea-page";
import { getCurrentUser } from "@/lib/auth/session";
import { getActiveGrantCall } from "@/lib/data/grant-calls";
import { getAuthorIdeaReview, getIdea } from "@/lib/data/ideas";

export const metadata: Metadata = {
  title: "Fiszka pomysłu",
  description: "Pełna kanwa zgłoszonego pomysłu.",
};

export default async function IdeaDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [idea, call, user] = await Promise.all([
    getIdea(id),
    getActiveGrantCall(),
    getCurrentUser(),
  ]);
  const signedIn = Boolean(user);

  if (!idea) {
    return <LocalIdeaPage id={id} call={call} signedIn={signedIn} />;
  }

  const review = await getAuthorIdeaReview(idea, user);

  return (
    <IdeaWorkspace idea={idea} crumb={idea.title}>
      {idea.status === "draft" && user && idea.authorId === user.id ? (
        <p>
          <Link
            href={`/ideas/new?draft=${encodeURIComponent(idea.id)}`}
            className={buttonVariants()}
          >
            Edytuj i wyślij szkic
          </Link>
        </p>
      ) : null}
      <IdeaArticle idea={idea} review={review} />
      {call ? (
        <GrantDraftPanel call={call} idea={idea} signedIn={signedIn} />
      ) : null}
    </IdeaWorkspace>
  );
}
