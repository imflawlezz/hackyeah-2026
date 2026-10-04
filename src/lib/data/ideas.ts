import type { Idea, IdeaCanvas } from "@/types";
import { ideas as mockIdeas } from "@/lib/mocks";
import { createClient, hasSupabase } from "@/lib/supabase/server";

export type IdeaReview = { note: string; reviewed_at: string | null };

/** Server-only author read, also protected by the session client's RLS. */
export async function getAuthorIdeaReview(
  idea: Idea,
  user: { id: string } | null,
): Promise<IdeaReview | null> {
  if (!user || idea.authorId !== user.id) return null;
  const client = await createClient();
  if (!client) return null;
  const { data, error } = await client
    .from("idea_reviews")
    .select("note, reviewed_at")
    .eq("idea_id", idea.id)
    .maybeSingle<IdeaReview>();
  return !error && data?.note?.trim() ? data : null;
}

const CANVAS_KEYS = [
  "problem",
  "solution",
  "novelty",
  "resources",
  "partners",
  "risks",
  "successMeasures",
] as const;

export type IdeaRow = {
  id: string;
  author_id?: string | null;
  title: string;
  essence: string;
  target_group: string;
  stage: Idea["stage"];
  status: Idea["status"];
  canvas?: unknown;
  municipality?: string | null;
  created_at: string;
};

export type IdeaWrite = {
  title: string;
  summary: string;
  targetGroup: string;
  stage: Idea["stage"];
  status: Idea["status"];
  canvas?: IdeaCanvas;
  municipality?: string;
};

export function toIdea(row: IdeaRow): Idea {
  return {
    id: row.id,
    authorId: row.author_id ?? undefined,
    title: row.title,
    summary: row.essence,
    targetGroup: row.target_group,
    stage: row.stage,
    status: row.status,
    canvas: canvasFromJson(row.canvas),
    municipality: row.municipality ?? undefined,
    createdAt: row.created_at,
  };
}

export function fromIdea(input: IdeaWrite) {
  return {
    title: input.title,
    essence: input.summary,
    target_group: input.targetGroup,
    stage: input.stage,
    status: input.status,
    canvas: input.canvas ?? {},
    municipality: input.municipality?.trim() || null,
  };
}

function canvasFromJson(value: unknown): IdeaCanvas | undefined {
  if (!value || typeof value !== "object" || Array.isArray(value))
    return undefined;
  const canvas: IdeaCanvas = {};
  for (const key of CANVAS_KEYS) {
    const field = (value as Record<string, unknown>)[key];
    if (typeof field === "string" && field.trim()) canvas[key] = field;
  }
  return Object.keys(canvas).length ? canvas : undefined;
}

function byNewest(left: Idea, right: Idea) {
  return right.createdAt.localeCompare(left.createdAt);
}

export async function listPublicIdeas(): Promise<Idea[]> {
  const fallback = () =>
    mockIdeas
      .filter(
        (idea) => idea.status === "submitted" || idea.status === "reviewed",
      )
      .sort(byNewest);
  if (!hasSupabase) return fallback();
  try {
    const supabase = await createClient();
    if (!supabase) return fallback();
    const { data, error } = await supabase
      .from("ideas")
      .select(
        "id, author_id, title, essence, target_group, stage, status, canvas, municipality, created_at",
      )
      .in("status", ["submitted", "reviewed"])
      .order("created_at", { ascending: false });
    if (error || !data) return fallback();
    return data.map((row) => toIdea(row as IdeaRow));
  } catch {
    return fallback();
  }
}

export async function listMyIdeas(userId: string): Promise<Idea[]> {
  const fallback = () =>
    mockIdeas
      .filter((idea) => idea.authorId === userId && idea.status === "draft")
      .sort(byNewest);
  if (!hasSupabase) return fallback();
  try {
    const supabase = await createClient();
    if (!supabase) return fallback();
    const { data, error } = await supabase
      .from("ideas")
      .select(
        "id, author_id, title, essence, target_group, stage, status, canvas, municipality, created_at",
      )
      .eq("author_id", userId)
      .eq("status", "draft")
      .order("created_at", { ascending: false });
    if (error || !data) return fallback();
    return data.map((row) => toIdea(row as IdeaRow));
  } catch {
    return fallback();
  }
}

export async function getIdea(id: string): Promise<Idea | null> {
  const fromMocks = mockIdeas.find((idea) => idea.id === id) ?? null;
  if (!hasSupabase || id.startsWith("local-")) return fromMocks;
  try {
    const supabase = await createClient();
    if (!supabase) return fromMocks;
    const { data, error } = await supabase
      .from("ideas")
      .select(
        "id, author_id, title, essence, target_group, stage, status, canvas, municipality, created_at",
      )
      .eq("id", id)
      .maybeSingle();
    if (error || !data) return fromMocks;
    return toIdea(data as IdeaRow);
  } catch {
    return fromMocks;
  }
}
