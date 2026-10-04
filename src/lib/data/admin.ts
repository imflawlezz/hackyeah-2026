import type { InnovationInput } from "@/lib/admin/innovation-schema";
import { toIdea } from "@/lib/data/ideas";
import type {
  AdminIdea,
  AdminInnovation,
  AdminProblem,
  InnovationStatus,
} from "@/lib/admin/types";

export const ADMIN_INNOVATION_COLUMNS =
  "id, title, summary, description, category, target_group, region, tags, video_url, image_url, status, created_at, updated_at";
export const ADMIN_PROBLEM_COLUMNS =
  "id, description, category, status, best_score, source, admin_note, created_at";
export const ADMIN_IDEA_COLUMNS =
  "id, title, essence, target_group, stage, status, canvas, idea_reviews(note), created_at";

export type AdminInnovationRow = {
  id: string;
  title: string;
  summary: string | null;
  description: string;
  category: string;
  target_group: string;
  region: string | null;
  tags: string[] | null;
  video_url: string | null;
  image_url: string | null;
  status?: InnovationStatus | null;
  created_at: string;
  updated_at?: string | null;
};

export type AdminProblemRow = {
  id: string;
  description: string;
  category: string | null;
  status: AdminProblem["status"];
  best_score?: number | null;
  source?: "ai" | "mock" | null;
  admin_note?: string | null;
  created_at: string;
};

export type AdminIdeaRow = {
  canvas?: unknown;
  id: string;
  title: string;
  essence: string;
  target_group: string;
  stage: AdminIdea["stage"];
  status: AdminIdea["status"];
  idea_reviews?: { note: string | null } | null;
  created_at: string;
};

export function toAdminInnovation(
  row: AdminInnovationRow,
  hasEmbedding: boolean,
): AdminInnovation {
  return {
    id: row.id,
    title: row.title,
    summary: row.summary ?? "",
    description: row.description,
    category: row.category,
    targetGroup: row.target_group,
    region: row.region ?? "",
    tags: row.tags ?? [],
    videoUrl: row.video_url ?? undefined,
    imageUrl: row.image_url ?? undefined,
    status: row.status ?? "published",
    hasEmbedding,
    createdAt: row.created_at,
    updatedAt: row.updated_at ?? row.created_at,
  };
}

export function toInnovationRow(input: InnovationInput) {
  return {
    title: input.title,
    summary: input.summary,
    description: input.description,
    category: input.category,
    target_group: input.targetGroup,
    region: input.region,
    tags: input.tags,
    video_url: input.videoUrl,
    image_url: input.imageUrl,
    status: input.status,
  };
}

export function toAdminProblem(row: AdminProblemRow): AdminProblem {
  return {
    id: row.id,
    description: row.description,
    category: row.category,
    status: row.status,
    bestScore: typeof row.best_score === "number" ? row.best_score : null,
    source: row.source ?? null,
    adminNote: row.admin_note ?? null,
    createdAt: row.created_at,
  };
}

/** ideas.essence ↔ Idea.summary */
export function toAdminIdea(row: AdminIdeaRow): AdminIdea {
  return {
    canvas: toIdea(row).canvas,
    id: row.id,
    title: row.title,
    summary: row.essence,
    targetGroup: row.target_group,
    stage: row.stage,
    status: row.status,
    reviewNote: row.idea_reviews?.note ?? null,
    createdAt: row.created_at,
  };
}
