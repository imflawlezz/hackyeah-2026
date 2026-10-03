export type Role = "resident" | "jst" | "admin" | "expert";

export interface Profile {
  id: string;
  role: Role;
  displayName: string;
  municipality?: string;
  createdAt: string;
}

export interface Innovation {
  id: string;
  title: string;
  summary?: string;
  description: string;
  category: string;
  targetGroup: string;
  region?: string;
  tags: string[];
  videoUrl?: string;
  imageUrl?: string;
  createdAt: string;
}

export interface Problem {
  id: string;
  authorId?: string;
  description: string;
  category?: string;
  status: "new" | "matched" | "closed";
  createdAt: string;
}

export interface Idea {
  id: string;
  authorId?: string;
  title: string;
  summary: string;
  targetGroup: string;
  stage: "idea" | "prototype" | "pilot";
  status: "draft" | "submitted" | "reviewed";
  createdAt: string;
}

export interface Feedback {
  id: string;
  innovationId: string;
  authorId?: string;
  rating: 1 | 2 | 3 | 4 | 5;
  comment?: string;
  createdAt: string;
}

export interface MatchRequest {
  problem: string;
  category?: string;
  limit?: number;
}

export interface MatchResult {
  innovation: Innovation;
  /** Relevance in [0, 1], rounded to two decimals; mock scores are relative to the top result. */
  score: number;
  reason: string;
}
