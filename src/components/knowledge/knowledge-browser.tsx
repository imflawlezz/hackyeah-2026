"use client";

import { Tabs } from "@base-ui/react/tabs";
import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef } from "react";
import { ChallengeList } from "@/components/knowledge/challenge-list";
import { InnovationLibrary } from "@/components/knowledge/innovation-library";
import { MaterialList } from "@/components/knowledge/material-list";
import {
  KNOWLEDGE_TABS,
  type KnowledgeTab,
  type LibraryFilters,
  parseLibraryFilters,
  parseTab,
  writeLibraryFilters,
} from "@/lib/knowledge/url";
import type { Material } from "@/lib/mocks";
import type { Innovation } from "@/types";

const PANEL_HEADINGS: Record<KnowledgeTab, string> = {
  challenges: "Wyzwania Małopolski",
  library: "Biblioteka innowacji",
  materials: "Materiały",
};

// The URL is the state. replaceState keeps it in sync without a server round
// trip or a new history entry per keystroke; Next.js picks the change up in
// useSearchParams.
function replaceParams(update: (params: URLSearchParams) => void) {
  const params = new URLSearchParams(window.location.search);
  update(params);
  const query = params.toString();
  window.history.replaceState(
    null,
    "",
    query ? `${window.location.pathname}?${query}` : window.location.pathname,
  );
}

export function KnowledgeBrowser({
  innovations,
  materials,
  search = "",
}: {
  innovations: Innovation[];
  materials: Material[];
  /** The current query string, without the leading "?". */
  search?: string;
}) {
  const params = useMemo(() => new URLSearchParams(search), [search]);
  const tab = parseTab(params.get("tab"));
  const filters = useMemo(() => parseLibraryFilters(params), [params]);

  const handleFilters = useCallback((next: LibraryFilters) => {
    replaceParams((current) => writeLibraryFilters(current, next));
  }, []);

  // "Zobacz innowacje" on a challenge unmounts the link that had focus.
  const previousTab = useRef(tab);
  useEffect(() => {
    if (previousTab.current === tab) return;
    previousTab.current = tab;
    if (
      document.activeElement === null ||
      document.activeElement === document.body
    ) {
      document.querySelector<HTMLElement>('[role="tabpanel"]')?.focus();
    }
  }, [tab]);

  return (
    <Tabs.Root
      value={tab}
      onValueChange={(value) =>
        replaceParams((current) => current.set("tab", parseTab(value)))
      }
      className="flex flex-col gap-8"
    >
      <Tabs.List
        activateOnFocus
        aria-label="Sekcje bazy wiedzy"
        className="flex flex-col border-b border-border sm:flex-row sm:gap-2"
      >
        {KNOWLEDGE_TABS.map(({ id, label }) => (
          <Tabs.Tab
            key={id}
            value={id}
            className="-mb-px inline-flex min-h-12 cursor-pointer items-center border-l-4 border-transparent px-4 py-2 text-left text-base font-medium text-foreground hover:bg-muted sm:border-b-4 sm:border-l-0 data-active:border-primary data-active:font-bold data-active:text-heading"
          >
            {label}
          </Tabs.Tab>
        ))}
      </Tabs.List>

      {KNOWLEDGE_TABS.map(({ id }) => (
        <Tabs.Panel
          key={id}
          value={id}
          className="flex flex-col gap-6 rounded-sm"
        >
          <h2 className="sr-only">{PANEL_HEADINGS[id]}</h2>
          {id === "challenges" && <ChallengeList innovations={innovations} />}
          {id === "library" && (
            <InnovationLibrary
              innovations={innovations}
              filters={filters}
              onChange={handleFilters}
            />
          )}
          {id === "materials" && <MaterialList materials={materials} />}
        </Tabs.Panel>
      ))}
    </Tabs.Root>
  );
}

/** Reads the query string; must be rendered inside <Suspense>. */
export function KnowledgeBrowserFromUrl(props: {
  innovations: Innovation[];
  materials: Material[];
}) {
  const searchParams = useSearchParams();
  return <KnowledgeBrowser {...props} search={searchParams.toString()} />;
}
