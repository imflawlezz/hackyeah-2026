"use client";

import { useId, useSyncExternalStore, useState } from "react";
import { NativeSelect } from "@/components/ui/native-select";
import type { Idea } from "@/types";
import { IdeaFlashcard } from "@/components/ideas/idea-flashcard";
import { STAGE_LABEL } from "@/lib/ideas/labels";

const STAGES: Idea["stage"][] = ["idea", "prototype", "pilot"];

export function IdeasBrowser({
  publicIdeas,
  drafts,
}: {
  publicIdeas: Idea[];
  drafts: Idea[];
}) {
  const selectId = useId();
  const [stage, setStage] = useState<Idea["stage"] | "">("");
  const storedIdeas = useSyncExternalStore(
    () => () => {},
    () => window.localStorage.getItem("hubmi.ideas") ?? "",
    () => "",
  );
  let localIdeas: Idea[] = [];
  try {
    const parsed = storedIdeas ? (JSON.parse(storedIdeas) as unknown) : [];
    localIdeas = Array.isArray(parsed) ? (parsed as Idea[]) : [];
  } catch {
    localIdeas = [];
  }

  const localDrafts = localIdeas.filter((idea) => idea.status === "draft");
  const localPublic = localIdeas.filter(
    (idea) => idea.status === "submitted" || idea.status === "reviewed",
  );
  const known = new Set([
    ...publicIdeas.map((idea) => idea.id),
    ...drafts.map((idea) => idea.id),
  ]);
  const matchesStage = (idea: Idea) => !stage || idea.stage === stage;
  const visiblePublic = [
    ...localPublic.filter((idea) => !known.has(idea.id)),
    ...publicIdeas,
  ].filter(matchesStage);
  const visibleDrafts = [
    ...drafts,
    ...localDrafts.filter((idea) => !known.has(idea.id)),
  ].filter(matchesStage);

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-2">
        <label htmlFor={selectId} className="font-semibold">
          Etap
        </label>
        <NativeSelect
          id={selectId}
          value={stage}
          onChange={(event) =>
            setStage(event.target.value as Idea["stage"] | "")
          }
          className="max-w-xs"
        >
          <option value="">Wszystkie etapy</option>
          {STAGES.map((item) => (
            <option key={item} value={item}>
              {STAGE_LABEL[item]}
            </option>
          ))}
        </NativeSelect>
        <p aria-live="polite">
          Widoczne fiszki: {visiblePublic.length + visibleDrafts.length}.
        </p>
      </div>

      <section aria-labelledby="public-ideas" className="flex flex-col gap-4">
        <h2 id="public-ideas" className="text-2xl text-heading">
          Pomysły w Hubie
        </h2>
        {visiblePublic.length ? (
          <ul className="divide-y divide-border border-y border-border">
            {visiblePublic.map((idea) => (
              <li key={idea.id}>
                <IdeaFlashcard idea={idea} />
              </li>
            ))}
          </ul>
        ) : (
          <p>Nie ma fiszek na wybranym etapie.</p>
        )}
      </section>

      {visibleDrafts.length ? (
        <section aria-labelledby="draft-ideas" className="flex flex-col gap-4">
          <h2 id="draft-ideas" className="text-2xl text-heading">
            Twoje szkice
          </h2>
          <ul className="divide-y divide-border border-y border-border">
            {visibleDrafts.map((idea) => (
              <li key={idea.id}>
                <IdeaFlashcard idea={idea} />
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
