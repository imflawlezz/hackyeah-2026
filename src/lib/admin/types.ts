import type { Idea, Problem } from "@/types";

export type InnovationStatus = "draft" | "published" | "archived";

export interface AdminInnovation {
  id: string;
  title: string;
  summary: string;
  description: string;
  category: string;
  targetGroup: string;
  region: string;
  tags: string[];
  videoUrl?: string;
  imageUrl?: string;
  status: InnovationStatus;
  hasEmbedding: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AdminProblem {
  id: string;
  description: string;
  category: string | null;
  status: Problem["status"];
  /** Top raw cosine similarity from AI matching; null for mock matches or old rows. */
  bestScore: number | null;
  source: "ai" | "mock" | null;
  adminNote: string | null;
  createdAt: string;
}

export interface AdminIdea {
  id: string;
  title: string;
  summary: string;
  targetGroup: string;
  stage: Idea["stage"];
  status: Idea["status"];
  reviewNote: string | null;
  createdAt: string;
}

export type TrendPeriod = "30" | "90" | "all";

export const TREND_PERIODS: { value: TrendPeriod; label: string }[] = [
  { value: "30", label: "30 dni" },
  { value: "90", label: "90 dni" },
  { value: "all", label: "Cały okres" },
];

/** Result of every admin server action. `message` is shown in a toast and announced. */
export type ActionResult = { ok: boolean; message: string };
