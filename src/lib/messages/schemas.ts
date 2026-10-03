import { z } from "zod";
export const conversationKindSchema = z.enum([
  "ask_rops",
  "ask_expert",
  "partnership",
]);
export const startConversationSchema = z
  .object({
    kind: conversationKindSchema,
    subject: z.string().trim().min(1).max(200),
    body: z.string().trim().min(1).max(4000),
    innovationId: z.string().max(100).optional(),
    ideaId: z.string().max(100).optional(),
    recipient: z.string().max(100).optional(),
  })
  .refine((v) => v.kind !== "partnership" || Boolean(v.recipient), {
    path: ["recipient"],
    message: "Wybierz partnera.",
  });
export const messageSchema = z.object({
  id: z.string(),
  conversationId: z.string(),
  authorId: z.string(),
  body: z.string().trim().min(1).max(4000),
  createdAt: z.iso.datetime(),
});
export const notificationSchema = z.object({
  id: z.string(),
  userId: z.string(),
  type: z.enum(["message", "idea_submitted", "idea_reviewed", "system"]),
  title: z.string(),
  body: z.string(),
  link: z.string().startsWith("/"),
  readAt: z.iso.datetime().optional(),
  createdAt: z.iso.datetime(),
});
export const conversationSchema = z.object({
  id: z.string(),
  kind: conversationKindSchema,
  subject: z.string().min(1).max(200),
  createdBy: z.string(),
  innovationId: z.string().optional(),
  ideaId: z.string().optional(),
  createdAt: z.iso.datetime(),
  lastMessageAt: z.iso.datetime(),
  lastReadAt: z.iso.datetime().optional(),
  preview: z.string(),
  unread: z.boolean(),
  people: z.array(
    z.object({
      id: z.string(),
      displayName: z.string(),
      role: z.enum(["resident", "jst", "admin", "expert"]),
    }),
  ),
});
