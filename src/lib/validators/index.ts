import { z } from "zod";
export {
  conversationSchema,
  conversationKindSchema,
  messageSchema,
  notificationSchema,
  startConversationSchema,
} from "@/lib/messages/schemas";
import type {
  Availability,
  Feedback,
  FeedbackSummary,
  Idea,
  Innovation,
  InnovationTest,
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

export const ideaSchema = z.object({
  id: z.string(),
  authorId: z.string().optional(),
  title: z.string(),
  summary: z.string(),
  targetGroup: z.string(),
  stage: z.enum(["idea", "prototype", "pilot"]),
  status: z.enum(["draft", "submitted", "reviewed"]),
  createdAt: z.string(),
}) satisfies z.ZodType<Idea>;

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
