import { z } from "zod";
import type {
  Feedback,
  GrantCall,
  GrantDraft,
  GrantSection,
  Idea,
  IdeaCanvas,
  Innovation,
  MatchRequest,
  MatchResult,
  Problem,
  Profile,
  Role,
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
  description: z.string(),
  category: z.string(),
  targetGroup: z.string(),
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

export const feedbackSchema = z.object({
  id: z.string(),
  innovationId: z.string(),
  authorId: z.string().optional(),
  rating: z.union([
    z.literal(1),
    z.literal(2),
    z.literal(3),
    z.literal(4),
    z.literal(5),
  ]),
  comment: z.string().optional(),
  createdAt: z.string(),
}) satisfies z.ZodType<Feedback>;

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
