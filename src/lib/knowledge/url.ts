export const KNOWLEDGE_TABS = [
  { id: "challenges", label: "Wyzwania Małopolski" },
  { id: "library", label: "Biblioteka innowacji" },
  { id: "materials", label: "Materiały" },
] as const;

export type KnowledgeTab = (typeof KNOWLEDGE_TABS)[number]["id"];

export const DEFAULT_TAB: KnowledgeTab = "library";

export type LibraryFilters = {
  q: string;
  categories: string[];
  group: string;
};

export const EMPTY_FILTERS: LibraryFilters = {
  q: "",
  categories: [],
  group: "",
};

export function parseTab(value: string | null): KnowledgeTab {
  return KNOWLEDGE_TABS.find((tab) => tab.id === value)?.id ?? DEFAULT_TAB;
}

/** Reads ?q=&category=&category=&group=. */
export function parseLibraryFilters(params: URLSearchParams): LibraryFilters {
  return {
    q: params.get("q") ?? "",
    categories: params.getAll("category").filter(Boolean),
    group: params.get("group") ?? "",
  };
}

/** Writes the filters into `params`, dropping empty ones to keep URLs short. */
export function writeLibraryFilters(
  params: URLSearchParams,
  filters: LibraryFilters,
): void {
  params.delete("q");
  params.delete("category");
  params.delete("group");
  if (filters.q) params.set("q", filters.q);
  for (const category of filters.categories) {
    params.append("category", category);
  }
  if (filters.group) params.set("group", filters.group);
}

/** Link to the library tab filtered by the given categories. */
export function libraryHref(categories: readonly string[] = []): string {
  const params = new URLSearchParams({ tab: "library" });
  for (const category of categories) params.append("category", category);
  return `/knowledge?${params.toString()}`;
}

export function matchHref(category: string): string {
  return `/match?${new URLSearchParams({ category }).toString()}`;
}
