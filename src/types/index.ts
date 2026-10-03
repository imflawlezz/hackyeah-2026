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

export type InstitutionType =
  | "gmina"
  | "powiat"
  | "ops_cus"
  | "pcpr"
  | "dps_sds"
  | "ngo"
  | "school"
  | "other";

export type MunicipalityType = "wiejska" | "miejsko-wiejska" | "miejska";
export type PopulationBand = "<5k" | "5-20k" | "20-100k" | ">100k";
/** PLN per year available for the action. */
export type BudgetBand = "<20k" | "20-100k" | "100-500k" | ">500k";

export interface InstitutionProfile {
  institutionType: InstitutionType;
  municipalityType?: MunicipalityType;
  populationBand: PopulationBand;
  budgetBand: BudgetBand;
  /** People from the team who can take part, 0 to 20. */
  staffAvailable: number;
  targetGroup: string;
  need: string;
  constraints?: string;
  /** Months until the service should be running. */
  timeline: 3 | 6 | 12;
  innovationId?: string;
}

export interface ImplementationPlan {
  innovationId: string;
  title: string;
  summary: string;
  whyItFits: string;
  adaptations: string[];
  steps: { title: string; description: string; weeks: number; owner: string }[];
  /** Rough ranges in PLN, never single quotes. */
  costs: { item: string; minPln: number; maxPln: number; note?: string }[];
  /** Sum of the cost rows, recomputed on the server. */
  totalMinPln: number;
  totalMaxPln: number;
  people: { role: string; fte?: number; note?: string }[];
  /** `type` is a kind of organisation, never a named real entity. */
  partners: { type: string; role: string }[];
  risks: { risk: string; mitigation: string }[];
  kpis: { indicator: string; target: string }[];
  fundingOptions: string[];
  assumptions: string[];
  source: "ai" | "template";
}
