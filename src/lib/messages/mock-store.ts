import {
  mockConversations,
  mockMessages,
  mockNotifications,
  DEMO_USER,
} from "@/lib/mocks/messages";
import {
  startConversationSchema,
  conversationSchema,
  messageSchema,
  notificationSchema,
} from "./schemas";
import { z } from "zod";
import type { Conversation, Message, Notification } from "@/types";
export type MessageState = {
  conversations: Conversation[];
  messages: Message[];
  notifications: Notification[];
};
export const seed: MessageState = {
  conversations: mockConversations,
  messages: mockMessages,
  notifications: mockNotifications,
};
const KEY = "hubmi-messages-v1";
const stateSchema = z.object({
  conversations: z.array(conversationSchema),
  messages: z.array(messageSchema),
  notifications: z.array(notificationSchema),
});
export function createMockStore(
  storage?: Pick<Storage, "getItem" | "setItem">,
  channel?: BroadcastChannel,
) {
  let state: MessageState = structuredClone(seed);
  const listeners = new Set<() => void>();
  try {
    const saved = storage?.getItem(KEY);
    if (saved) {
      const parsed = stateSchema.safeParse(JSON.parse(saved));
      if (parsed.success) state = parsed.data;
    }
  } catch {
    /* A blocked storage remains usable in memory. */
  }
  const emit = () => listeners.forEach((fn) => fn());
  const persist = () => {
    try {
      storage?.setItem(KEY, JSON.stringify(state));
    } catch {
      /* Keep the current session usable. */
    }
  };
  if (channel)
    channel.onmessage = (event: MessageEvent<MessageState>) => {
      const parsed = stateSchema.safeParse(event.data);
      if (!parsed.success) return;
      state = parsed.data;
      persist();
      emit();
    };
  function update(fn: (draft: MessageState) => void) {
    state = structuredClone(state);
    fn(state);
    persist();
    channel?.postMessage(state);
    emit();
  }
  return {
    getSnapshot: () => state,
    subscribe: (fn: () => void) => {
      listeners.add(fn);
      return () => {
        listeners.delete(fn);
      };
    },
    receive(message: Message) {
      messageSchema.parse(message);
      update((s) => {
        if (s.messages.some((m) => m.id === message.id)) return;
        s.messages.push(message);
        const c = s.conversations.find((c) => c.id === message.conversationId);
        if (c) {
          c.preview = message.body;
          c.lastMessageAt = message.createdAt;
          c.unread = message.authorId !== DEMO_USER;
        }
        if (message.authorId !== DEMO_USER)
          s.notifications.unshift({
            id: crypto.randomUUID(),
            userId: DEMO_USER,
            type: "message",
            title: "Nowa wiadomość",
            body: c?.subject ?? "",
            link: `/messages/${message.conversationId}`,
            createdAt: message.createdAt,
          });
      });
    },
    send(conversationId: string, body: string) {
      body = z.string().trim().min(1).max(4000).parse(body);
      if (!state.conversations.some((c) => c.id === conversationId))
        throw new Error("Nie znaleźliśmy rozmowy.");
      const message = {
        id: crypto.randomUUID(),
        conversationId,
        authorId: DEMO_USER,
        body,
        createdAt: new Date().toISOString(),
      };
      this.receive(message);
      return message;
    },
    start(input: unknown) {
      const v = startConversationSchema.parse(input);
      const id = crypto.randomUUID();
      const now = new Date().toISOString();
      update((s) =>
        s.conversations.unshift({
          id,
          kind: v.kind,
          subject: v.subject,
          createdBy: DEMO_USER,
          innovationId: v.innovationId,
          ideaId: v.ideaId,
          createdAt: now,
          lastMessageAt: now,
          preview: v.body,
          unread: false,
          people: [
            { id: DEMO_USER, displayName: "Marta P.", role: "resident" },
            {
              id: v.recipient || "demo-admin",
              displayName:
                v.kind === "ask_expert"
                  ? "Anna K."
                  : v.kind === "partnership"
                    ? "CUS w Gminie Przykładowej"
                    : "Zespół ROPS",
              role: v.kind === "ask_expert" ? "expert" : "admin",
            },
          ],
        }),
      );
      this.send(id, v.body);
      return id;
    },
    markRead(id: string) {
      update((s) => {
        const c = s.conversations.find((c) => c.id === id);
        if (c) {
          c.lastReadAt = new Date().toISOString();
          c.unread = false;
        }
      });
    },
    markNotificationRead(id?: string) {
      update((s) =>
        s.notifications.forEach((n) => {
          if (!id || n.id === id) n.readAt = new Date().toISOString();
        }),
      );
    },
    close() {
      channel?.close();
      listeners.clear();
    },
  };
}
let singleton: ReturnType<typeof createMockStore> | undefined;
export function getMockStore() {
  if (!singleton) {
    let storage: Storage | undefined;
    try {
      storage = window.localStorage;
    } catch {
      /* Memory fallback. */
    }
    singleton = createMockStore(
      storage,
      typeof BroadcastChannel === "undefined"
        ? undefined
        : new BroadcastChannel(KEY),
    );
  }
  return singleton;
}
