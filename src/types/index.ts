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
  description: string;
  category: string;
  targetGroup: string;
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

export interface IdeaCanvas {
  problem?: string;
  solution?: string;
  novelty?: string;
  resources?: string;
  partners?: string;
  risks?: string;
  successMeasures?: string;
}

export interface Idea {
  id: string;
  authorId?: string;
  title: string;
  summary: string;
  targetGroup: string;
  stage: "idea" | "prototype" | "pilot";
  status: "draft" | "submitted" | "reviewed";
  canvas?: IdeaCanvas;
  municipality?: string;
  createdAt: string;
}

export interface GrantSection {
  key: string;
  heading: string;
  guidance: string;
  maxChars: number;
}

export interface GrantCall {
  id: string;
  title: string;
  organizer: string;
  description: string;
  startsAt: string;
  endsAt: string;
  maxAmountPln?: number;
  requiredSections: GrantSection[];
  createdAt: string;
}

export interface GrantDraftSection {
  key: string;
  heading: string;
  body: string;
}

export interface GrantDraft {
  id: string;
  ideaId: string;
  callId: string;
  authorId?: string;
  content: { sections: GrantDraftSection[] };
  createdAt: string;
  updatedAt: string;
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
