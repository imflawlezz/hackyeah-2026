"use server";
import * as data from "@/lib/data/messages";
import { z } from "zod";
export async function loadMessages() {
  const { user } = await data.sessionClient();
  if (!user)
    return {
      demo: true as const,
      userId: "demo-resident",
      conversations: [],
      messages: [],
      notifications: [],
    };
  const conversations = await data.listConversations(user.id);
  return {
    demo: false as const,
    userId: user.id,
    conversations,
    messages: (
      await Promise.all(conversations.map((c) => data.listMessages(c.id)))
    ).flat(),
    notifications: await data.listNotifications(),
  };
}
export async function sendMessage(id: string, body: string) {
  return data.sendMessage(
    z.uuid().parse(id),
    z.string().trim().min(1).max(4000).parse(body),
  );
}
export async function startConversation(input: unknown) {
  return data.startConversation(input);
}
export async function markRead(id: string) {
  return data.markRead(z.uuid().parse(id));
}
export async function readNotification(id?: string) {
  if (id) await data.markNotificationRead(z.uuid().parse(id));
  else await data.markAllNotificationsRead();
}
