import { z } from "zod";
import type {
  Availability,
  Feedback,
  FeedbackSummary,
  GrantCall,
  GrantDraft,
  GrantSection,
  Idea,
  ImplementationPlan,
  IdeaCanvas,
  Innovation,
  InnovationTest,
  InstitutionProfile,
  MatchRequest,
  MatchResult,
  Problem,
  Profile,
  Rating,
  Role,
  TestSignup,
} from "@/types";

export const roleSchema = z.enum([
  "resident",
  "jst",
  "admin",
  "expert",
]) satisfies z.ZodType<Role>;

export const profileSchema = z.object({
  id: z.string(),
  role: roleSchema,
  displayName: z.string(),
  municipality: z.string().optional(),
  createdAt: z.string(),
}) satisfies z.ZodType<Profile>;

export const innovationSchema = z.object({
  id: z.string(),
  title: z.string(),
  summary: z.string().optional(),
  description: z.string(),
  category: z.string(),
  targetGroup: z.string(),
  region: z.string().optional(),
  tags: z.array(z.string()),
  videoUrl: z.string().optional(),
  imageUrl: z.string().optional(),
  createdAt: z.string(),
}) satisfies z.ZodType<Innovation>;

export const problemSchema = z.object({
  id: z.string(),
  authorId: z.string().optional(),
  description: z.string(),
  category: z.string().optional(),
  status: z.enum(["new", "matched", "closed"]),
  createdAt: z.string(),
}) satisfies z.ZodType<Problem>;

export const ideaCanvasSchema = z.object({
  problem: z.string().optional(),
  solution: z.string().optional(),
  novelty: z.string().optional(),
  resources: z.string().optional(),
  partners: z.string().optional(),
  risks: z.string().optional(),
  successMeasures: z.string().optional(),
}) satisfies z.ZodType<IdeaCanvas>;

export const ideaSchema = z.object({
  id: z.string(),
  authorId: z.string().optional(),
  title: z.string(),
  summary: z.string(),
  targetGroup: z.string(),
  stage: z.enum(["idea", "prototype", "pilot"]),
  status: z.enum(["draft", "submitted", "reviewed"]),
  canvas: ideaCanvasSchema.optional(),
  municipality: z.string().optional(),
  createdAt: z.string(),
}) satisfies z.ZodType<Idea>;

export const grantSectionSchema = z.object({
  key: z.string(),
  heading: z.string(),
  guidance: z.string(),
  maxChars: z.number().int().positive(),
}) satisfies z.ZodType<GrantSection>;

export const grantCallSchema = z.object({
  id: z.string(),
  title: z.string(),
  organizer: z.string(),
  description: z.string(),
  startsAt: z.string(),
  endsAt: z.string(),
  maxAmountPln: z.number().int().nonnegative().optional(),
  requiredSections: z.array(grantSectionSchema),
  createdAt: z.string(),
}) satisfies z.ZodType<GrantCall>;

export const grantDraftSchema = z.object({
  id: z.string(),
  ideaId: z.string(),
  callId: z.string(),
  authorId: z.string().optional(),
  content: z.object({
    sections: z.array(
      z.object({
        key: z.string(),
        heading: z.string(),
        body: z.string(),
      }),
    ),
  }),
  createdAt: z.string(),
  updatedAt: z.string(),
}) satisfies z.ZodType<GrantDraft>;

export const ratingSchema = z.union([
  z.literal(1),
  z.literal(2),
  z.literal(3),
  z.literal(4),
  z.literal(5),
]) satisfies z.ZodType<Rating>;

export const feedbackSchema = z.object({
  id: z.string(),
  innovationId: z.string(),
  authorId: z.string().optional(),
  rating: ratingSchema,
  comment: z.string().optional(),
  testId: z.string().optional(),
  easeOfUse: ratingSchema.optional(),
  wouldRecommend: z.boolean().optional(),
  whatWorked: z.string().optional(),
  whatToImprove: z.string().optional(),
  createdAt: z.string(),
}) satisfies z.ZodType<Feedback>;

export const innovationTestSchema = z.object({
  id: z.string(),
  innovationId: z.string(),
  title: z.string(),
  description: z.string(),
  municipality: z.string(),
  startsAt: z.string(),
  endsAt: z.string(),
  slots: z.number().int().positive(),
  status: z.enum(["open", "closed"]),
  createdAt: z.string(),
}) satisfies z.ZodType<InnovationTest>;

export const availabilitySchema = z.enum([
  "morning",
  "afternoon",
  "evening",
  "weekend",
]) satisfies z.ZodType<Availability>;

export const testSignupSchema = z.object({
  id: z.string(),
  testId: z.string(),
  userId: z.string().optional(),
  motivation: z.string().optional(),
  availability: availabilitySchema.optional(),
  accessibilityNeeds: z.string().optional(),
  status: z.enum(["pending", "accepted", "declined"]),
  createdAt: z.string(),
}) satisfies z.ZodType<TestSignup>;

const countSchema = z.number().int().nonnegative();

export const feedbackSummarySchema = z.object({
  count: countSchema,
  avgRating: z.number().nullable(),
  distribution: z.object({
    1: countSchema,
    2: countSchema,
    3: countSchema,
    4: countSchema,
    5: countSchema,
  }),
  avgEase: z.number().nullable(),
  recommendShare: z.number().min(0).max(1).nullable(),
}) satisfies z.ZodType<FeedbackSummary>;

export const matchRequestSchema = z.object({
  problem: z.string().min(1),
  category: z.string().optional(),
  limit: z.number().int().positive().optional(),
}) satisfies z.ZodType<MatchRequest>;

export const matchResultSchema = z.object({
  innovation: innovationSchema,
  score: z.number(),
  reason: z.string(),
}) satisfies z.ZodType<MatchResult>;

export const institutionProfileSchema = z.object({
  institutionType: z.enum([
    "gmina",
    "powiat",
    "ops_cus",
    "pcpr",
    "dps_sds",
    "ngo",
    "school",
    "other",
  ]),
  municipalityType: z
    .enum(["wiejska", "miejsko-wiejska", "miejska"])
    .optional(),
  populationBand: z.enum(["<5k", "5-20k", "20-100k", ">100k"]),
  budgetBand: z.enum(["<20k", "20-100k", "100-500k", ">500k"]),
  staffAvailable: z.number().int().min(0).max(20),
  targetGroup: z.string().trim().min(1).max(200),
  need: z.string().trim().min(10).max(1500),
  constraints: z.string().trim().max(1000).optional(),
  timeline: z.union([z.literal(3), z.literal(6), z.literal(12)]),
  innovationId: z.string().min(1).max(100).optional(),
}) satisfies z.ZodType<InstitutionProfile>;

const planText = z.string().trim().min(1);
const pln = z.number().int().nonnegative();

export const implementationPlanSchema = z.object({
  innovationId: z.string().min(1),
  title: planText,
  summary: planText,
  whyItFits: planText,
  adaptations: z.array(planText).min(1),
  steps: z
    .array(
      z.object({
        title: planText,
        description: planText,
        weeks: z.number().int().positive(),
        owner: planText,
      }),
    )
    .min(1),
  costs: z
    .array(
      z.object({
        item: planText,
        minPln: pln,
        maxPln: pln,
        note: z.string().optional(),
      }),
    )
    .min(1),
  totalMinPln: pln,
  totalMaxPln: pln,
  people: z
    .array(
      z.object({
        role: planText,
        fte: z.number().positive().optional(),
        note: z.string().optional(),
      }),
    )
    .min(1),
  partners: z.array(z.object({ type: planText, role: planText })).min(1),
  risks: z.array(z.object({ risk: planText, mitigation: planText })).min(1),
  kpis: z.array(z.object({ indicator: planText, target: planText })).min(1),
  fundingOptions: z.array(planText).min(1),
  assumptions: z.array(planText).min(1),
  source: z.enum(["ai", "template"]),
}) satisfies z.ZodType<ImplementationPlan>;
