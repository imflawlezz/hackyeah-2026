export type Role = "resident" | "jst" | "admin" | "expert";

export type ConversationKind = "ask_rops" | "ask_expert" | "partnership";
export interface Conversation {
  id: string;
  kind: ConversationKind;
  subject: string;
  createdBy: string;
  innovationId?: string;
  ideaId?: string;
  createdAt: string;
  lastMessageAt: string;
  people: { id: string; displayName: string; role: Role }[];
  lastReadAt?: string;
  preview: string;
  unread: boolean;
}
export interface Message {
  id: string;
  conversationId: string;
  authorId: string;
  body: string;
  createdAt: string;
}
export interface Notification {
  id: string;
  userId: string;
  type: "message" | "idea_submitted" | "idea_reviewed" | "system";
  title: string;
  body: string;
  link: string;
  readAt?: string;
  createdAt: string;
}

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

export type Rating = 1 | 2 | 3 | 4 | 5;

export interface Feedback {
  id: string;
  innovationId: string;
  authorId?: string;
  rating: Rating;
  comment?: string;
  testId?: string;
  easeOfUse?: Rating;
  wouldRecommend?: boolean;
  whatWorked?: string;
  whatToImprove?: string;
  createdAt: string;
}

export interface InnovationTest {
  id: string;
  innovationId: string;
  title: string;
  description: string;
  municipality: string;
  /** ISO date, YYYY-MM-DD. */
  startsAt: string;
  /** ISO date, YYYY-MM-DD. */
  endsAt: string;
  slots: number;
  status: "open" | "closed";
  createdAt: string;
}

export type Availability = "morning" | "afternoon" | "evening" | "weekend";

export interface TestSignup {
  id: string;
  testId: string;
  userId?: string;
  motivation?: string;
  availability?: Availability;
  accessibilityNeeds?: string;
  status: "pending" | "accepted" | "declined";
  createdAt: string;
}

/** Public aggregates only; individual feedback is never part of it. */
export interface FeedbackSummary {
  count: number;
  /** null when there is no feedback yet. */
  avgRating: number | null;
  /** How many opinions gave each rating. */
  distribution: Record<Rating, number>;
  avgEase: number | null;
  /** Share of "yes" among those who answered, 0 to 1. */
  recommendShare: number | null;
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
