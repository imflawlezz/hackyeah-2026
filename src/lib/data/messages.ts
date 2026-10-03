import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth/session";
import { startConversationSchema } from "@/lib/messages/schemas";
import { isUnread } from "@/lib/messages/format";
import type { Conversation, Message, Notification } from "@/types";
export async function sessionClient() {
  const user = await getCurrentUser();
  const client = user ? await createClient() : null;
  return { user, client };
}
function checked<T>(result: { data: T; error: unknown }): T {
  if (result.error)
    throw new Error("Nie udało się pobrać danych. Spróbuj ponownie.");
  return result.data;
}
export function toMessage(row: Record<string, string>): Message {
  return {
    id: row.id,
    conversationId: row.conversation_id,
    authorId: row.author_id,
    body: row.body,
    createdAt: row.created_at,
  };
}
export function toNotification(row: Record<string, string>): Notification {
  return {
    id: row.id,
    userId: row.user_id,
    type: row.type as Notification["type"],
    title: row.title,
    body: row.body,
    link: row.link,
    readAt: row.read_at || undefined,
    createdAt: row.created_at,
  };
}
export async function listMessages(conversationId: string) {
  const { client } = await sessionClient();
  if (!client) return [];
  return checked(
    await client
      .from("messages")
      .select("id,conversation_id,author_id,body,created_at")
      .eq("conversation_id", conversationId)
      .order("created_at"),
  )!.map(toMessage);
}
export async function getConversation(
  id: string,
): Promise<Conversation | null> {
  const { user, client } = await sessionClient();
  if (!client || !user) return null;
  const row = checked(
    await client.from("conversations").select("*").eq("id", id).maybeSingle(),
  );
  if (!row) return null;
  const people =
    checked(await client.rpc("conversation_people", { p_conversation: id })) ??
    [];
  const participant = checked(
    await client
      .from("conversation_participants")
      .select("last_read_at")
      .eq("conversation_id", id)
      .eq("user_id", user.id)
      .maybeSingle(),
  );
  const last = checked(
    await client
      .from("messages")
      .select("body")
      .eq("conversation_id", id)
      .order("created_at", { ascending: false })
      .limit(1),
  );
  return {
    id: row.id,
    kind: row.kind,
    subject: row.subject,
    createdBy: row.created_by,
    innovationId: row.innovation_id ?? undefined,
    ideaId: row.idea_id ?? undefined,
    createdAt: row.created_at,
    lastMessageAt: row.last_message_at,
    lastReadAt: participant?.last_read_at ?? undefined,
    preview: last?.[0]?.body ?? "",
    unread: isUnread(row.last_message_at, participant?.last_read_at),
    people: people.map(
      (p: {
        id: string;
        display_name: string;
        role: Conversation["people"][number]["role"];
      }) => ({ id: p.id, displayName: p.display_name, role: p.role }),
    ),
  };
}
export async function listConversations(userId: string) {
  const { user, client } = await sessionClient();
  if (!client || user?.id !== userId) return [];
  const rows = checked(
    await client
      .from("conversations")
      .select("id")
      .order("last_message_at", { ascending: false }),
  );
  return (await Promise.all(rows!.map((r) => getConversation(r.id)))).filter(
    (c): c is Conversation => c !== null,
  );
}
export async function listExperts() {
  const { client } = await sessionClient();
  if (!client) return [];
  return (checked(await client.rpc("list_experts")) ?? []).map(
    (p: { id: string; display_name: string; municipality: string }) => ({
      id: p.id,
      displayName: p.display_name,
      municipality: p.municipality,
    }),
  );
}
export async function startConversation(input: unknown): Promise<string> {
  const v = startConversationSchema.parse(input);
  const { client } = await sessionClient();
  if (!client) throw new Error("Zaloguj się, aby wysłać wiadomość.");
  return checked(
    await client.rpc("start_conversation", {
      p_kind: v.kind,
      p_subject: v.subject,
      p_body: v.body,
      p_innovation_id: v.innovationId ?? null,
      p_idea_id: v.ideaId ?? null,
      p_recipient: v.recipient ?? null,
    }),
  );
}
export async function sendMessage(conversationId: string, body: string) {
  const { client, user } = await sessionClient();
  if (!client || !user) throw new Error("Zaloguj się.");
  return toMessage(
    checked(
      await client
        .from("messages")
        .insert({ conversation_id: conversationId, author_id: user.id, body })
        .select("id,conversation_id,author_id,body,created_at")
        .single(),
    )!,
  );
}
export async function markRead(conversationId: string) {
  const { client, user } = await sessionClient();
  if (!client || !user) return;
  checked(
    await client
      .from("conversation_participants")
      .update({ last_read_at: new Date().toISOString() })
      .eq("conversation_id", conversationId)
      .eq("user_id", user.id),
  );
}
export async function listNotifications() {
  const { client, user } = await sessionClient();
  if (!client || !user) return [];
  return checked(
    await client
      .from("notifications")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false }),
  )!.map(toNotification);
}
export async function markNotificationRead(id: string) {
  const { client, user } = await sessionClient();
  if (!client || !user) throw new Error("Zaloguj się.");
  checked(
    await client
      .from("notifications")
      .update({ read_at: new Date().toISOString() })
      .eq("id", id)
      .eq("user_id", user.id),
  );
}
export async function markAllNotificationsRead() {
  const { client, user } = await sessionClient();
  if (!client || !user) throw new Error("Zaloguj się.");
  checked(
    await client
      .from("notifications")
      .update({ read_at: new Date().toISOString() })
      .eq("user_id", user.id)
      .is("read_at", null),
  );
}
