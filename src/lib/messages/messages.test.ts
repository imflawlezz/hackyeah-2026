import { describe, expect, it } from "vitest";
import {
  conversationSchema,
  messageSchema,
  notificationSchema,
  startConversationSchema,
} from "./schemas";
import { unreadLabel, isUnread, relativeTime } from "./format";
import { createMockStore, seed } from "./mock-store";
describe("message contracts", () => {
  it("validates fixtures and limits", () => {
    seed.conversations.forEach((c) =>
      expect(conversationSchema.safeParse(c).success).toBe(true),
    );
    seed.messages.forEach((m) =>
      expect(messageSchema.safeParse(m).success).toBe(true),
    );
    seed.notifications.forEach((n) =>
      expect(notificationSchema.safeParse(n).success).toBe(true),
    );
    expect(
      startConversationSchema.safeParse({
        kind: "ask_rops",
        subject: "test",
        body: " ".repeat(10),
      }).success,
    ).toBe(false);
    expect(
      startConversationSchema.safeParse({
        kind: "partnership",
        subject: "test",
        body: "test",
      }).success,
    ).toBe(false);
    expect(
      messageSchema.safeParse({ ...seed.messages[0], body: "x".repeat(4001) })
        .success,
    ).toBe(false);
  });
  it.each([
    [0, "nieprzeczytanych"],
    [1, "nieprzeczytane"],
    [2, "nieprzeczytane"],
    [12, "nieprzeczytanych"],
    [22, "nieprzeczytane"],
    [111, "nieprzeczytanych"],
  ])("formats %i", (count, word) =>
    expect(unreadLabel(count as number)).toBe(
      `Powiadomienia, ${count} ${word}`,
    ),
  );
  it("calculates unread state and Polish relative time", () => {
    expect(isUnread("2026-10-03T10:00:00Z", "2026-10-03T09:00:00Z")).toBe(true);
    expect(isUnread("2026-10-03T10:00:00Z", "2026-10-03T10:00:00Z")).toBe(
      false,
    );
    expect(
      relativeTime("2026-10-03T09:00:00Z", Date.parse("2026-10-03T10:00:00Z")),
    ).toBe("1 godzinę temu");
  });
  it("sends and receives through two channels and persists", () => {
    const channels: {
      onmessage?: (e: MessageEvent) => void;
      postMessage: (data: unknown) => void;
      close: () => void;
    }[] = [];
    const channel = () => {
      const c = {
        onmessage: undefined as ((e: MessageEvent) => void) | undefined,
        postMessage(data: unknown) {
          channels
            .filter((other) => other !== c)
            .forEach((other) =>
              other.onmessage?.({
                data: structuredClone(data),
              } as MessageEvent),
            );
        },
        close() {},
      };
      channels.push(c);
      return c as unknown as BroadcastChannel;
    };
    const values = new Map<string, string>();
    const storage = {
      getItem: (key: string) => values.get(key) ?? null,
      setItem: (key: string, value: string) => {
        values.set(key, value);
      },
    };
    const a = createMockStore(storage, channel());
    const b = createMockStore(storage, channel());
    const message = a.send(seed.conversations[0].id, "Wiadomość testowa");
    expect(b.getSnapshot().messages.at(-1)).toEqual(message);
    b.receive({ ...message, id: "incoming", authorId: "demo-expert" });
    expect(a.getSnapshot().notifications.at(0)?.type).toBe("message");
    expect(createMockStore(storage).getSnapshot().messages.at(-1)?.id).toBe(
      "incoming",
    );
    a.close();
    b.close();
  });
});
