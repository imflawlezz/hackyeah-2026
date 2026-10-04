"use client";

import { ArrowTopRightOnSquareIcon } from "@heroicons/react/20/solid";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { startTransition, useOptimistic, useState } from "react";
import {
  closeProblemAction,
  reviewIdeaAction,
  setInnovationStatusAction,
} from "@/app/admin/actions";
import { MatchQualityBadge } from "@/components/admin/badges";
import {
  ConfirmDialog,
  type ConfirmRequest,
} from "@/components/admin/confirm-dialog";
import { useAdminAction } from "@/components/admin/use-admin-action";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type {
  AdminIdea,
  AdminInnovation,
  AdminProblem,
  ActionResult,
} from "@/lib/admin/types";

export type ModerationTab = "ideas" | "problems" | "drafts";

function parseTab(value: unknown): ModerationTab {
  return value === "problems" || value === "drafts" ? value : "ideas";
}

const STAGES: Record<AdminIdea["stage"], string> = {
  idea: "Pomysł",
  prototype: "Prototyp",
  pilot: "Pilotaż",
};

const LINK =
  "inline-flex min-h-11 items-center gap-2 rounded-sm text-primary underline underline-offset-4 hover:no-underline";
const ITEM = "flex flex-col gap-2.5 rounded-md border border-border p-4 sm:p-5";
const META = "flex flex-wrap gap-x-4 gap-y-1 text-base text-muted-foreground";

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("pl-PL", {
    timeZone: "Europe/Warsaw",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function PanelHeading({
  id,
  children,
}: {
  id: string;
  children: React.ReactNode;
}) {
  return (
    <h2 id={id} tabIndex={-1} className="rounded-sm text-xl font-semibold">
      {children}
    </h2>
  );
}

function Empty({ children }: { children: React.ReactNode }) {
  return (
    <p className="rounded-md border border-dashed border-border px-4 py-6">
      {children}
    </p>
  );
}

export function Moderation({
  ideas,
  problems,
  drafts,
}: {
  ideas: AdminIdea[];
  problems: (AdminProblem & { excerpt: string })[];
  drafts: AdminInnovation[];
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  // The URL is the state: the sidebar link to the bare /admin/moderation is a
  // soft navigation that keeps this component mounted, so local state would
  // keep the old tab. router.replace waits for the server; the optimistic
  // value switches the tab at once and gives way to the URL on commit.
  const [tab, setOptimisticTab] = useOptimistic(
    parseTab(searchParams.get("tab")),
  );
  const [confirm, setConfirm] = useState<ConfirmRequest | null>(null);
  const { pending, message, run } = useAdminAction();

  const panelHeading = () =>
    document.getElementById(`moderation-${tab}-heading`);

  function act(action: () => Promise<ActionResult>) {
    run(action, (result) => {
      // The item leaves the list, so give focus a stable place to land.
      if (result.ok)
        document.getElementById(`moderation-${tab}-heading`)?.focus();
    });
  }

  const counts = {
    ideas: ideas.length,
    problems: problems.length,
    drafts: drafts.length,
  };
  const tabs: { value: ModerationTab; label: string }[] = [
    { value: "ideas", label: "Pomysły" },
    { value: "problems", label: "Problemy" },
    { value: "drafts", label: "Szkice innowacji" },
  ];

  return (
    <>
      <Tabs
        value={tab}
        onValueChange={(value) => {
          const next = parseTab(value);
          startTransition(() => {
            setOptimisticTab(next);
            router.replace(`/admin/moderation?tab=${next}`, { scroll: false });
          });
        }}
      >
        <TabsList className="w-full sm:w-fit">
          {tabs.map((item) => (
            <TabsTrigger key={item.value} value={item.value}>
              {/* The space keeps the accessible name as "Problemy 15". */}
              {item.label}{" "}
              {/* The border keeps the count visible on the white active tab
                  and on the gray strip alike. */}
              <span className="inline-flex min-w-6 items-center justify-center rounded-sm border border-input bg-background px-2 text-sm leading-6 font-semibold text-foreground tabular-nums">
                {counts[item.value]}
              </span>
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="ideas" className="flex flex-col gap-4 text-lg">
          <PanelHeading id="moderation-ideas-heading">
            Pomysły czekające na przegląd
          </PanelHeading>
          {ideas.length ? (
            <ul className="flex flex-col gap-2.5">
              {ideas.map((idea) => (
                <li key={idea.id}>
                  <article aria-labelledby={`idea-${idea.id}`} className={ITEM}>
                    <h3
                      id={`idea-${idea.id}`}
                      className="text-lg font-semibold"
                    >
                      {idea.title}
                    </h3>
                    <p>{idea.summary}</p>
                    <p className={META}>
                      <span>
                        <span className="font-semibold text-foreground">
                          Dla kogo:
                        </span>{" "}
                        {idea.targetGroup}
                      </span>
                      <span>
                        <span className="font-semibold text-foreground">
                          Etap:
                        </span>{" "}
                        {STAGES[idea.stage]}
                      </span>
                      <span>
                        Wysłano{" "}
                        <time dateTime={idea.createdAt}>
                          {formatDate(idea.createdAt)}
                        </time>
                      </span>
                    </p>
                    <div className="flex flex-wrap items-center gap-2.5">
                      <Button
                        type="button"
                        variant="outline"
                        className="h-auto min-h-11 max-w-full py-2 whitespace-normal"
                        aria-disabled={pending || undefined}
                        onClick={() =>
                          !pending &&
                          setConfirm({
                            title: `Odpowiedz autorowi pomysłu „${idea.title}”`,
                            description:
                              "Autor dostanie powiadomienie, a pomysł zmieni status na „przejrzany”.",
                            confirmLabel: "Wyślij i oznacz jako przejrzane",
                            noteLabel: "Wiadomość do autora",
                            noteHint:
                              "Autor zobaczy tę wiadomość na stronie swojego pomysłu.",
                            focusAfterConfirm: panelHeading,
                            onConfirm: (note) =>
                              act(() => reviewIdeaAction(idea.id, note)),
                          })
                        }
                      >
                        Odpowiedz autorowi
                        <span className="sr-only">: {idea.title}</span>
                      </Button>
                      <Link
                        href={`/ideas/${encodeURIComponent(idea.id)}`}
                        className={LINK}
                      >
                        Otwórz pomysł
                        <span className="sr-only">: {idea.title}</span>
                      </Link>
                    </div>
                  </article>
                </li>
              ))}
            </ul>
          ) : (
            <Empty>Nie ma pomysłów do przejrzenia.</Empty>
          )}
        </TabsContent>

        <TabsContent value="problems" className="flex flex-col gap-4 text-lg">
          <PanelHeading id="moderation-problems-heading">
            Nowe zgłoszenia problemów
          </PanelHeading>
          {problems.length ? (
            <ul className="flex flex-col gap-2.5">
              {problems.map((problem, index) => (
                <li key={problem.id}>
                  <article
                    aria-labelledby={`problem-${problem.id}`}
                    className={ITEM}
                  >
                    <h3
                      id={`problem-${problem.id}`}
                      className="text-lg font-semibold"
                    >
                      <span className="sr-only">Zgłoszenie {index + 1}: </span>
                      {problem.category ?? "Bez kategorii"}
                    </h3>
                    <p className={META}>
                      <time dateTime={problem.createdAt}>
                        {formatDate(problem.createdAt)}
                      </time>
                      <MatchQualityBadge
                        bestScore={problem.bestScore}
                        source={problem.source}
                      />
                    </p>
                    <blockquote className="border-l-4 border-border pl-4">
                      {problem.excerpt}
                    </blockquote>
                    <div className="flex flex-wrap items-center gap-2.5">
                      <Button
                        type="button"
                        variant="outline"
                        className="h-auto min-h-11 max-w-full py-2 whitespace-normal"
                        aria-disabled={pending || undefined}
                        onClick={() =>
                          !pending &&
                          setConfirm({
                            title: "Zamknąć to zgłoszenie?",
                            description:
                              "Zgłoszenie zniknie z tej listy, ale zostanie w statystykach trendów.",
                            confirmLabel: "Zamknij zgłoszenie",
                            noteLabel: "Notatka dla zespołu",
                            noteHint: "Widzą ją tylko administratorzy.",
                            focusAfterConfirm: panelHeading,
                            onConfirm: (note) =>
                              act(() => closeProblemAction(problem.id, note)),
                          })
                        }
                      >
                        Zamknij
                      </Button>
                      <a
                        href={`/match?${new URLSearchParams({ q: problem.excerpt.slice(0, 500) }).toString()}`}
                        target="_blank"
                        rel="noopener"
                        className={LINK}
                      >
                        Szukaj rozwiązań
                        <ArrowTopRightOnSquareIcon
                          aria-hidden="true"
                          className="size-5"
                        />{" "}
                        <span className="sr-only">
                          (otwiera się w nowym oknie)
                        </span>
                      </a>
                    </div>
                  </article>
                </li>
              ))}
            </ul>
          ) : (
            <Empty>Nie ma nowych zgłoszeń.</Empty>
          )}
        </TabsContent>

        <TabsContent value="drafts" className="flex flex-col gap-4 text-lg">
          <PanelHeading id="moderation-drafts-heading">
            Szkice innowacji
          </PanelHeading>
          {drafts.length ? (
            <ul className="flex flex-col gap-2.5">
              {drafts.map((draft) => (
                <li key={draft.id}>
                  <article
                    aria-labelledby={`draft-${draft.id}`}
                    className={ITEM}
                  >
                    <h3
                      id={`draft-${draft.id}`}
                      className="text-lg font-semibold"
                    >
                      {draft.title}
                    </h3>
                    <p>{draft.summary}</p>
                    <p className={META}>
                      <span>
                        <span className="font-semibold text-foreground">
                          Kategoria:
                        </span>{" "}
                        {draft.category}
                      </span>
                      <span>
                        <span className="font-semibold text-foreground">
                          Dla kogo:
                        </span>{" "}
                        {draft.targetGroup}
                      </span>
                    </p>
                    <div className="flex flex-wrap items-center gap-2.5">
                      <Button
                        type="button"
                        variant="outline"
                        className="h-auto min-h-11 max-w-full py-2 whitespace-normal"
                        aria-disabled={pending || undefined}
                        onClick={() =>
                          !pending &&
                          setConfirm({
                            title: `Opublikować „${draft.title}”?`,
                            description:
                              "Innowacja pojawi się w bazie wiedzy i w wynikach dopasowania.",
                            confirmLabel: "Opublikuj",
                            focusAfterConfirm: panelHeading,
                            onConfirm: () =>
                              act(() =>
                                setInnovationStatusAction(
                                  draft.id,
                                  "published",
                                ),
                              ),
                          })
                        }
                      >
                        Opublikuj
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        className="h-auto min-h-11 max-w-full py-2 whitespace-normal"
                        aria-disabled={pending || undefined}
                        onClick={() =>
                          !pending &&
                          setConfirm({
                            title: `Zarchiwizować „${draft.title}”?`,
                            description:
                              "Szkic zniknie z tej listy. Możesz go przywrócić w edycji innowacji.",
                            confirmLabel: "Zarchiwizuj",
                            focusAfterConfirm: panelHeading,
                            onConfirm: () =>
                              act(() =>
                                setInnovationStatusAction(draft.id, "archived"),
                              ),
                          })
                        }
                      >
                        Archiwizuj
                      </Button>
                      <Link
                        href={`/admin/innovations/${encodeURIComponent(draft.id)}/edit`}
                        className={LINK}
                      >
                        Edytuj<span className="sr-only">: {draft.title}</span>
                      </Link>
                    </div>
                  </article>
                </li>
              ))}
            </ul>
          ) : (
            <Empty>Nie ma szkiców do decyzji.</Empty>
          )}
        </TabsContent>
      </Tabs>

      <p role="status" aria-live="polite" className="sr-only">
        {pending ? "Zapisuję zmianę…" : message}
      </p>
      <ConfirmDialog request={confirm} onClose={() => setConfirm(null)} />
    </>
  );
}
