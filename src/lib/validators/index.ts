import { z } from "zod";
import type {
  Feedback,
  Idea,
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
