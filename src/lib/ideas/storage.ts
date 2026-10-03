import type { Idea } from "@/types";

export const LOCAL_IDEAS_KEY = "hubmi.ideas";
export const LOCAL_DRAFT_KEY = "hubmi.idea-draft";

export function readLocalIdeas(): Idea[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(LOCAL_IDEAS_KEY);
    const parsed = raw ? (JSON.parse(raw) as unknown) : [];
    return Array.isArray(parsed) ? (parsed as Idea[]) : [];
  } catch {
    return [];
  }
}

export function writeLocalIdea(idea: Idea) {
  const ideas = readLocalIdeas().filter((item) => item.id !== idea.id);
  window.localStorage.setItem(
    LOCAL_IDEAS_KEY,
    JSON.stringify([idea, ...ideas]),
  );
}

export function readLocalIdea(id: string): Idea | null {
  return readLocalIdeas().find((idea) => idea.id === id) ?? null;
}
