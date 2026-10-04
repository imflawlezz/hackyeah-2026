"use client";

import Link from "next/link";
import { useSyncExternalStore } from "react";
import { buttonVariants } from "@/components/ui/button";
import type { GrantCall } from "@/types";
import { GrantDraftPanel } from "@/components/ideas/grant-draft-panel";
import { IdeaArticle } from "@/components/ideas/idea-article";
import { IdeaWorkspace } from "@/components/ideas/idea-workspace";
import { readLocalIdea } from "@/lib/ideas/storage";

export function LocalIdeaPage({
  id,
  call,
  signedIn,
}: {
  id: string;
  call: GrantCall | null;
  signedIn: boolean;
}) {
  const client = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );
  const idea = client ? readLocalIdea(id) : undefined;

  if (idea === undefined) return <p>Wczytywanie pomysłu.</p>;
  if (!idea) {
    return (
      <p>
        Nie znaleziono pomysłu. Wróć do listy albo dodaj nowy na stronie
        kreatora.
      </p>
    );
  }

  return (
    <IdeaWorkspace idea={idea} crumb={idea.title}>
      {idea.status === "draft" ? (
        <p>
          <Link
            href={`/ideas/new?draft=${encodeURIComponent(idea.id)}`}
            className={buttonVariants()}
          >
            Edytuj szkic
          </Link>
        </p>
      ) : null}
      <IdeaArticle idea={idea} />
      {call ? (
        <GrantDraftPanel call={call} idea={idea} signedIn={signedIn} />
      ) : null}
    </IdeaWorkspace>
  );
}
