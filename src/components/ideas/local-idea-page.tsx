"use client";

import { useSyncExternalStore } from "react";
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
    <IdeaWorkspace idea={idea}>
      <IdeaArticle idea={idea} />
      {call ? (
        <GrantDraftPanel call={call} idea={idea} signedIn={signedIn} />
      ) : null}
    </IdeaWorkspace>
  );
}
